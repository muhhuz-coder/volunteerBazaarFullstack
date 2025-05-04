
// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
// Import types/interfaces from services
import type { VolunteerApplication } from '@/services/job-board';
import type { Conversation } from '@/services/messaging';
import type { VolunteerStats } from '@/services/gamification';
// Import persistence utils - We should avoid using fs-dependent utils directly on the client
// import { readData, writeData, mapToObject, objectToMap } from '@/lib/db-utils';

// Import service functions that interact with persisted data
import {
  getConversationsForUser as fetchConversations,
  createConversation as createNewConversation,
  getConversationDetails as fetchConversationDetails, // Needed for type
  sendMessage as postMessage, // Needed for type
} from '@/services/messaging';
import {
  getUserStats as fetchUserStats,
  getLeaderboard as fetchLeaderboard, // Assuming leaderboard reads persisted data
  addPoints as addGamificationPoints,
  awardBadge as awardGamificationBadge,
} from '@/services/gamification';
import {
    submitVolunteerApplication as postApplication,
    updateApplicationStatus as updateAppStatus, // Import for acceptApplication
    getApplicationsForOrganization as fetchOrgApplications, // Needed for type
    getApplicationsForVolunteer as fetchVolunteerApplications, // Needed for type
} from '@/services/job-board';
// Import server actions that will handle data persistence
import { signInUser, signUpUser, updateUserRole } from '@/actions/auth-actions';
import { acceptVolunteerApplication, submitVolunteerApplicationAction } from '@/actions/application-actions';
import { addPointsAction, awardBadgeAction } from '@/actions/gamification-actions';
import { getUserConversationsAction } from '@/actions/messaging-actions';


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
  submitApplication: (application: Omit<VolunteerApplication, 'id' | 'status' | 'submittedAt' | 'volunteerId'>) => Promise<{ success: boolean; message: string }>;
  acceptApplication: (applicationId: string, volunteerId: string) => Promise<{ success: boolean; message: string; conversationId?: string }>;
  getUserConversations: () => Promise<Conversation[]>;
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
  // We no longer load the full usersData map on the client
  // const [usersData, setUsersData] = useState<Map<string, UserProfile>>(new Map());
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
        // Call the server action
        const result = await signInUser(email, pass);

        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user)); // Persist session simply
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
        // Call the server action
        const result = await signUpUser(email, pass, name, roleToSet);

        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user)); // Persist session
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
    sessionStorage.removeItem('loggedInUser'); // Clear session
    setLoading(false);
    router.push('/'); // Redirect to home
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
        // Call the server action
        const result = await updateUserRole(user.id, roleToSet);
        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user)); // Update persisted session
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
         const result = await addPointsAction(userId, points, reason); // Server action handles persistence
         if (result.success) {
             // If the action affects the current user, update their context state
             if (user && user.id === userId && result.newStats) {
               const updatedUser = { ...user, stats: result.newStats };
               setUser(updatedUser);
               sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser)); // Update session storage
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
          const result = await awardBadgeAction(userId, badgeName, reason); // Server action handles persistence
          if (result.success) {
              // If the action affects the current user, update their context state
              if (user && user.id === userId && result.newStats) {
                  const updatedUser = { ...user, stats: result.newStats };
                  setUser(updatedUser);
                  sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser)); // Update session storage
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
    setLoading(true); // Indicate processing
    try {
      // Call the server action for submitting the application
      const submitResult = await submitVolunteerApplicationAction(applicationData, user.id, user.displayName || user.email); // Pass volunteer details

      if (submitResult.success) {
        // Award points using the context method (which calls the server action)
        await addPointsProxy(user.id, 5, `Applied for opportunity: ${applicationData.opportunityTitle}`);
        return { success: true, message: submitResult.message };
      } else {
         return { success: false, message: submitResult.message || 'Application submission failed.' };
      }

    } catch (error: any) {
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
        // Call the server action to handle accepting the application
        const result = await acceptVolunteerApplication(applicationId, volunteerId, user.id, user.displayName);

        if (result.success) {
             // Award points to the volunteer via the context method (calling the server action)
            if (result.updatedApp) {
                await addPointsProxy(volunteerId, 50, `Accepted for opportunity: ${result.updatedApp.opportunityTitle}`);
            }
            return { success: true, message: result.message, conversationId: result.conversationId };
        } else {
            console.error("Error accepting application via action:", result.message);
            return { success: false, message: result.message || 'Failed to accept application.' };
        }
     } catch (error: any) {
       console.error("Error accepting application:", error);
       return { success: false, message: error.message || 'Failed to accept application.' };
     } finally {
       setLoading(false);
     }
   }, [user, addPointsProxy]);

    const getUserConversations = useCallback(async (): Promise<Conversation[]> => {
        if (!user || !user.role) {
          console.error("Cannot get conversations: User not logged in or role not set.");
          return [];
        }
        // setLoading(true); // Optional: Show loading specifically for conversation fetch
        try {
          // Call the server action
          const conversations = await getUserConversationsAction(user.id, user.role);
          return conversations;
        } catch (error: any) {
          console.error("Failed to fetch conversations via action:", error);
          return []; // Return empty on error
        } finally {
             // setLoading(false);
        }
      }, [user]);



  // Initial loading state UI
  if (loading) {
    return (
       <div className="flex flex-col min-h-screen">
         {/* Simplified Skeleton Header */}
         <div className="bg-primary h-14 flex items-center justify-between px-4">
           <Skeleton className="h-7 w-48 bg-primary/50" />
           <Skeleton className="h-9 w-9 rounded-full bg-primary/50" />
         </div>
         {/* Simplified Skeleton Body */}
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
        getUserConversations,
        addPoints: addPointsProxy, // Use the proxy function
        awardBadge: awardBadgeProxy, // Use the proxy function
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
