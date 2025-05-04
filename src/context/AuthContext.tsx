
// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
// Import types/interfaces from services
import type { VolunteerApplication, Opportunity } from '@/services/job-board'; // Added Opportunity type
import type { Conversation } from '@/services/messaging';
import type { VolunteerStats } from '@/services/gamification';
// Import persistence utils - We should avoid using fs-dependent utils directly on the client

// Import service functions that interact with persisted data
// Services are generally called via Server Actions now

// Import server actions that will handle data persistence
import { signInUser, signUpUser, updateUserRole } from '@/actions/auth-actions';
import { acceptVolunteerApplication, rejectVolunteerApplication, submitVolunteerApplicationAction } from '@/actions/application-actions'; // Added reject action
import { addPointsAction, awardBadgeAction } from '@/actions/gamification-actions';
import { getUserConversationsAction, startConversationAction } from '@/actions/messaging-actions'; // Added startConversationAction


export type UserRole = 'volunteer' | 'organization' | null;

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  stats?: VolunteerStats; // Keep stats in profile for context access
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: UserRole;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; message: string; role?: UserRole | null }>;
  signUp: (email: string, pass: string, name: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  setRoleAndUpdateUser: (role: UserRole) => Promise<{ success: boolean; message: string }>;
  // Application Actions
  submitApplication: (application: Omit<VolunteerApplication, 'id' | 'status' | 'submittedAt' | 'volunteerId'>) => Promise<{ success: boolean; message: string }>;
  acceptApplication: (applicationId: string, volunteerId: string) => Promise<{ success: boolean; message: string; conversationId?: string }>;
  rejectApplication: (applicationId: string) => Promise<{ success: boolean; message: string }>; // Added reject signature
  // Messaging Actions
  getUserConversations: () => Promise<(Conversation & { unreadCount: number })[]>;
  startConversation: (data: {
    organizationId: string;
    opportunityId: string;
    initialMessage: string;
    opportunityTitle?: string;
    organizationName?: string;
  }) => Promise<{ success: boolean; conversation?: Conversation; error?: string }>; // Added start conversation signature
  // Gamification Actions
  addPoints: (userId: string, points: number, reason: string) => Promise<{success: boolean, newStats?: VolunteerStats | null}>;
  awardBadge: (userId: string, badgeName: string, reason: string) => Promise<{success: boolean, newStats?: VolunteerStats | null}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start loading until session is checked
  const [role, setRole] = useState<UserRole>(null);
  const router = useRouter();

  // Check session storage on initial client mount
  useEffect(() => {
    console.log('AuthProvider: Checking sessionStorage for existing session.');
    setLoading(true);
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        try {
            const parsedUser: UserProfile = JSON.parse(storedUser);
            setUser(parsedUser);
            setRole(parsedUser.role);
            console.log('AuthProvider: Restored user session from sessionStorage.', parsedUser);
        } catch (e) {
            console.error("AuthProvider: Error parsing stored user session.", e);
            sessionStorage.removeItem('loggedInUser');
        }
    } else {
        console.log('AuthProvider: No user session found in sessionStorage.');
    }
    setLoading(false); // Finish loading check
  }, []); // Run only once on mount

  // --- Auth Methods ---
  const signIn = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; role?: UserRole | null }> => {
    console.log('Attempting sign in for:', email);
    setLoading(true);
    try {
        const result = await signInUser(email, pass);
        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            console.log('Sign in successful via server action:', result.user);
            return { success: true, message: result.message, role: result.user.role };
        } else {
            console.log('Sign in failed via server action:', result.message);
            return { success: false, message: result.message || 'Invalid credentials.' };
        }
    } catch (error: any) {
        console.error("Sign in process failed:", error);
        return { success: false, message: error.message || 'An unexpected error occurred during login.' };
    } finally {
        setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, pass: string, name: string, roleToSet: UserRole): Promise<{ success: boolean; message: string }> => {
     console.log('Attempting sign up for:', email, 'with role:', roleToSet);
    if (!roleToSet) {
        return { success: false, message: 'Role is required for signup.' };
    }
    setLoading(true);
    try {
        const result = await signUpUser(email, pass, name, roleToSet);
        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            console.log('Sign up successful via server action:', result.user);
            return { success: true, message: result.message };
        } else {
            console.log('Sign up failed via server action:', result.message);
            return { success: false, message: result.message || 'Signup failed.' };
        }
    } catch (error: any) {
        console.error("Sign up process failed:", error);
        return { success: false, message: error.message || 'An unexpected error occurred during signup.' };
    } finally {
        setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('Signing out');
    setLoading(true);
    await sleep(300);
    setUser(null);
    setRole(null);
    sessionStorage.removeItem('loggedInUser');
    setLoading(false);
    router.push('/');
    console.log('Sign out complete');
  }, [router]);

  const setRoleAndUpdateUser = useCallback(async (roleToSet: UserRole): Promise<{ success: boolean; message: string }> => {
     if (!user) {
       console.error("Cannot set role: No user logged in.");
       return { success: false, message: 'User not logged in.' };
     }
     if (!roleToSet) {
         console.error("Cannot set role: Role is null or undefined.");
         return { success: false, message: 'Invalid role selected.' };
     }
     setLoading(true);
     try {
        const result = await updateUserRole(user.id, roleToSet);
        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            console.log(`Role updated to ${roleToSet} for user ${user.email} via server action.`);
            return { success: true, message: result.message };
        } else {
            console.error('Failed to update role via server action:', result.message);
            return { success: false, message: result.message || 'Failed to update role.'};
        }
     } catch (error: any) {
        console.error('Failed to set role:', error);
        return { success: false, message: error.message || 'Failed to update role.'};
     } finally {
        setLoading(false);
     }
   }, [user]);

   // --- Gamification Methods (Call Server Actions) ---
   const addPointsProxy = useCallback(async (userId: string, points: number, reason: string): Promise<{success: boolean, newStats?: VolunteerStats | null}> => {
       try {
         const result = await addPointsAction(userId, points, reason);
         if (result.success) {
             if (user && user.id === userId && result.newStats) {
               const updatedUser = { ...user, stats: result.newStats };
               setUser(updatedUser);
               sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
             }
             return { success: true, newStats: result.newStats };
         } else {
             console.error(`Context: Failed to add points: ${result.message}`);
             return { success: false };
         }
       } catch (error: any) {
           console.error(`Context: Failed to add points: ${error.message}`);
           return { success: false };
       }
   }, [user]);

    const awardBadgeProxy = useCallback(async (userId: string, badgeName: string, reason: string): Promise<{success: boolean, newStats?: VolunteerStats | null}> => {
        try {
          const result = await awardBadgeAction(userId, badgeName, reason);
          if (result.success) {
              if (user && user.id === userId && result.newStats) {
                  const updatedUser = { ...user, stats: result.newStats };
                  setUser(updatedUser);
                  sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
              }
              return { success: true, newStats: result.newStats };
          } else {
               console.error(`Context: Failed to award badge: ${result.message}`);
               return { success: false };
          }
        } catch (error: any) {
            console.error(`Context: Failed to award badge: ${error.message}`);
            return { success: false };
        }
    }, [user]);


  // --- Feature Methods (Call Server Actions) ---

  const submitApplication = useCallback(async (applicationData: Omit<VolunteerApplication, 'id' | 'status' | 'submittedAt' | 'volunteerId'>): Promise<{ success: boolean; message: string }> => {
    if (!user || user.role !== 'volunteer') {
      return { success: false, message: 'Only logged-in volunteers can apply.' };
    }
    setLoading(true);
    try {
      const submitResult = await submitVolunteerApplicationAction(applicationData, user.id, user.displayName || user.email);
      if (submitResult.success) {
        await addPointsProxy(user.id, 5, `Applied for opportunity: ${applicationData.opportunityTitle}`);
        return { success: true, message: submitResult.message };
      } else {
         return { success: false, message: submitResult.message || 'Application submission failed.' };
      }
    } catch (error: any) {
      console.error('Context: Application submission failed:', error);
      return { success: false, message: error.message || 'Application submission failed.' };
    } finally {
      setLoading(false);
    }
  }, [user, addPointsProxy]);

  const acceptApplication = useCallback(async (applicationId: string, volunteerId: string): Promise<{ success: boolean; message: string; conversationId?: string }> => {
     if (!user || user.role !== 'organization') {
       return { success: false, message: 'Only logged-in organizations can accept applications.' };
     }
     setLoading(true);
     try {
        const result = await acceptVolunteerApplication(applicationId, volunteerId, user.id, user.displayName);
        if (result.success) {
            // Points awarding is handled within the acceptVolunteerApplication action now
            console.log(`Context: Application ${applicationId} accepted successfully.`);
            return { success: true, message: result.message, conversationId: result.conversationId };
        } else {
            console.error("Context: Error accepting application via action:", result.message);
            return { success: false, message: result.message || 'Failed to accept application.' };
        }
     } catch (error: any) {
       console.error("Context: Error accepting application:", error);
       return { success: false, message: error.message || 'Failed to accept application.' };
     } finally {
       setLoading(false);
     }
   }, [user]); // Removed addPointsProxy dependency

  const rejectApplication = useCallback(async (applicationId: string): Promise<{ success: boolean; message: string }> => {
       if (!user || user.role !== 'organization') {
           return { success: false, message: 'Only logged-in organizations can reject applications.' };
       }
       setLoading(true);
       try {
           const result = await rejectVolunteerApplication(applicationId);
           if (result.success) {
               console.log(`Context: Application ${applicationId} rejected successfully.`);
               return { success: true, message: result.message };
           } else {
               console.error("Context: Error rejecting application via action:", result.message);
               return { success: false, message: result.message || 'Failed to reject application.' };
           }
       } catch (error: any) {
           console.error("Context: Error rejecting application:", error);
           return { success: false, message: error.message || 'Failed to reject application.' };
       } finally {
           setLoading(false);
       }
   }, [user]);

    const getUserConversations = useCallback(async (): Promise<(Conversation & { unreadCount: number })[]> => {
        if (!user || !user.role) {
          console.error("Context: Cannot get conversations: User not logged in or role not set.");
          return [];
        }
        try {
          const conversations = await getUserConversationsAction(user.id, user.role);
          return conversations;
        } catch (error: any) {
          console.error("Context: Failed to fetch conversations via action:", error);
          return [];
        }
      }, [user]);

    const startConversation = useCallback(async (data: {
        organizationId: string;
        opportunityId: string;
        initialMessage: string;
        opportunityTitle?: string;
        organizationName?: string;
      }): Promise<{ success: boolean; conversation?: Conversation; error?: string }> => {
        if (!user || user.role !== 'volunteer') {
            return { success: false, error: 'Only logged-in volunteers can start conversations.' };
        }
         if (!data.initialMessage.trim()) {
            return { success: false, error: "Initial message cannot be empty." };
         }
        setLoading(true);
        try {
            const result = await startConversationAction({
                ...data,
                volunteerId: user.id,
                volunteerName: user.displayName, // Pass volunteer name from context
            });
            if (result.success) {
                 console.log(`Context: Conversation started/retrieved successfully: ${result.conversation?.id}`);
                 return { success: true, conversation: result.conversation };
            } else {
                 console.error("Context: Error starting conversation via action:", result.error);
                 return { success: false, error: result.error || 'Failed to start conversation.' };
            }
        } catch (error: any) {
            console.error("Context: Error starting conversation:", error);
            return { success: false, error: error.message || 'Failed to start conversation.' };
        } finally {
            setLoading(false);
        }
    }, [user]);


  // Initial loading state UI
  if (loading) {
    return (
       <div className="flex flex-col min-h-screen">
         <div className="bg-primary h-14 flex items-center justify-between px-4">
           <Skeleton className="h-7 w-48 bg-primary/50" />
           <Skeleton className="h-9 w-9 rounded-full bg-primary/50" />
         </div>
         <div className="flex-grow container mx-auto px-4 py-8">
           <Skeleton className="h-64 w-full bg-muted" />
         </div>
       </div>
    );
  }

  return (
    <AuthContext.Provider value={{
        user,
        loading,
        role,
        signIn,
        signUp,
        signOut,
        setRoleAndUpdateUser,
        submitApplication,
        acceptApplication,
        rejectApplication, // Add rejectApplication to context value
        getUserConversations,
        startConversation, // Add startConversation to context value
        addPoints: addPointsProxy,
        awardBadge: awardBadgeProxy,
     }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

    