// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

// Import types/interfaces
import type { VolunteerApplication } from '@/services/job-board';
import type { Conversation } from '@/services/messaging';
import type { VolunteerStats } from '@/services/gamification';

// Import server actions
import {
    signInUser as signInUserAction,
    signUpUser as signUpUserAction,
    updateUserRole,
    getRefreshedUserAction,
    updateUserProfilePictureAction,
    updateUserProfileBioSkillsCauses as updateUserProfileBioSkillsCausesAction,
    sendPasswordResetEmailAction, // Import the action for password reset
} from '@/actions/auth-actions';
import {
    acceptVolunteerApplication,
    rejectVolunteerApplication,
    submitVolunteerApplicationAction,
    recordVolunteerPerformanceAction
} from '@/actions/application-actions';
import { addPointsAction, awardBadgeAction, logHoursAction } from '@/actions/gamification-actions';
import { getUserConversationsAction, startConversationAction, getConversationDetailsAction, sendMessageAction } from '@/actions/messaging-actions';
import type { Message } from '@/services/messaging';


export type UserRole = 'volunteer' | 'organization' | 'admin' | null;

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  stats?: VolunteerStats;
  profilePictureUrl?: string;
  bio?: string;
  skills?: string[];
  causes?: string[];
  onboardingCompleted?: boolean;
  passwordHash?: string; // Added for storing hashed password
  reportedBy?: string[]; // Array of user IDs who reported this user
  isBlocked?: boolean; // Flag to indicate if user is blocked
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: UserRole;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; message: string; user?: UserProfile | null }>;
  signUp: (email: string, pass: string, name: string, role: UserRole) => Promise<{ success: boolean; message: string; user?: UserProfile | null }>;
  signOut: () => Promise<void>;
  setRoleAndUpdateUser: (role: UserRole) => Promise<{ success: boolean; message: string }>;
  updateProfilePicture: (imageDataUri: string) => Promise<{ success: boolean; message: string; user?: UserProfile | null }>;
  updateUserProfile: (profileData: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'skills' | 'causes' | 'onboardingCompleted'>>) => Promise<{ success: boolean; message: string; user?: UserProfile | null }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  submitApplication: (application: Omit<VolunteerApplication, 'id' | 'status' | 'submittedAt' | 'volunteerId'>) => Promise<{ success: boolean; message: string }>;
  acceptApplication: (applicationId: string, volunteerId: string) => Promise<{ success: boolean; message: string; conversationId?: string, updatedApp?: VolunteerApplication | null }>;
  rejectApplication: (applicationId: string) => Promise<{ success: boolean; message: string; updatedApp?: VolunteerApplication | null }>;
  recordVolunteerPerformance: (applicationId: string, performanceData: { attendance: 'present' | 'absent' | 'pending'; orgRating?: number; hoursLoggedByOrg?: number; }) => Promise<{ success: boolean; message: string; updatedApplication?: VolunteerApplication | null }>;
  getUserConversations: () => Promise<(Conversation & { unreadCount: number })[]>;
  getConversationDetails: (conversationId: string) => Promise<{ conversation: Conversation; messages: Message[] } | { error: string }>;
  sendMessage: (conversationId: string, text: string) => Promise<{ success: boolean; message?: Message; error?: string }>;
  startConversation: (data: {
    organizationId: string;
    opportunityId: string;
    initialMessage: string;
    opportunityTitle?: string;
    organizationName?: string;
    volunteerName?: string; // Optional, can be fetched if needed or passed from context
  }) => Promise<{ success: boolean; conversation?: Conversation; error?: string }>;
  addPoints: (userId: string, points: number, reason: string) => Promise<{success: boolean, newStats?: VolunteerStats | null}>;
  awardBadge: (userId: string, badgeName: string, reason: string) => Promise<{success: boolean, newStats?: VolunteerStats | null}>;
  logHours: (userId: string, hours: number, reason: string) => Promise<{success: boolean, newStats?: VolunteerStats | null}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const [isClientHydrated, setIsClientHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClientHydrated(true);
    const restoreSession = async () => {
        console.log('AuthProvider: Checking sessionStorage for existing session.');
        setLoading(true);
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            try {
                const parsedUser: UserProfile = JSON.parse(storedUser);
                setUser(parsedUser);
                setRole(parsedUser.role);
                console.log('AuthProvider: Restored basic user session from sessionStorage.', {id: parsedUser.id, role: parsedUser.role});

                const refreshResult = await getRefreshedUserAction(parsedUser.id);
                if (refreshResult.success && refreshResult.user) {
                    setUser(refreshResult.user);
                    setRole(refreshResult.user.role);
                    sessionStorage.setItem('loggedInUser', JSON.stringify(refreshResult.user));
                    console.log('AuthProvider: Successfully refreshed user session from server.', {id: refreshResult.user.id, role: refreshResult.user.role});
                } else {
                    console.warn('AuthProvider: Failed to refresh user session from server. Using stored data.', refreshResult.message);
                }
            } catch (e) {
                console.error("AuthProvider: Error processing stored user session.", e);
                sessionStorage.removeItem('loggedInUser');
                setUser(null);
                setRole(null);
            }
        } else {
            console.log('AuthProvider: No user session found in sessionStorage.');
            setUser(null);
            setRole(null);
        }
        setLoading(false);
    };
    if (typeof window !== "undefined") {
        restoreSession();
    } else {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('AuthContext redirection useEffect triggered. State:', {
      loading,
      userId: user ? user.id : null,
      role,
      pathname,
      onboardingCompleted: user?.onboardingCompleted,
    });

    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
    const isSelectRolePage = pathname === '/select-role';
    const isOnboardingPage = pathname === '/onboarding';
    const isRootPage = pathname === '/';
    const isPublicPage = ['/', '/opportunities', '/volunteers', '/about', '/how-it-works', '/contact', '/apply'].some(p => pathname.startsWith(p) && (p !== '/apply' || pathname.split('/').length > 2)); // Allow /apply/[id]

    if (user) {
      console.log('AuthContext: User is present and not loading.');
      if (role) {
        if (user.onboardingCompleted === false && !isOnboardingPage && role !== 'admin') { // Admin bypasses onboarding
          console.log(`AuthContext: User has role ${role} but onboarding not complete. Redirecting to /onboarding.`);
          router.push('/onboarding');
        } else if (isAuthPage || isSelectRolePage || (isOnboardingPage && user.onboardingCompleted)) {
          const targetDashboard = role === 'admin' ? '/admin' : (role === 'organization' ? '/dashboard/organization' : '/dashboard/volunteer');
          console.log(`AuthContext: Current path ${pathname} is eligible for dashboard redirect. Redirecting to ${targetDashboard}...`);
          router.push(targetDashboard);
        } else {
          console.log(`AuthContext: User is on ${pathname}. No automatic redirect to dashboard needed.`);
        }
      } else if (!isSelectRolePage && !isOnboardingPage) {
        console.log(`AuthContext: User has no role. Current path ${pathname}. Redirecting to /select-role.`);
        router.push('/select-role');
      } else {
        console.log(`AuthContext: User has no role, but is already on /select-role or /onboarding. No redirect needed.`);
      }
    } else { // No user
      console.log('AuthContext: User is not present and not loading.');
      const protectedRoutes = ['/dashboard', '/profile/edit', '/notifications', '/select-role', '/onboarding', '/admin', '/chatbot', '/messages'];
      
      if (!isPublicPage && !isAuthPage && protectedRoutes.some(p => pathname.startsWith(p))) {
         console.log(`AuthProvider: User not logged in. Current path ${pathname} is protected. Redirecting to /login.`);
         router.push('/login');
      } else {
        console.log(`AuthContext: User not present, not loading. Path ${pathname} is public or an auth page. No redirect.`);
      }
    }
  }, [user, role, loading, router, pathname]);


  const signIn = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
    console.log('AuthContext: Attempting sign in for:', email);
    setLoading(true);
    try {
        const result = await signInUserAction(email, pass);
        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            console.log('AuthContext: Sign in successful. User and role set.', {id: result.user.id, role: result.user.role });
            return { success: true, message: result.message, user: result.user };
        } else {
            console.log('AuthContext: Sign in failed via server action:', result.message);
            return { success: false, message: result.message || 'Invalid credentials.', user: null };
        }
    } catch (error: any) {
        console.error("AuthContext: Sign in process failed:", error);
        return { success: false, message: error.message || 'An unexpected error occurred during login.', user: null };
    } finally {
        setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, pass: string, name: string, roleToSet: UserRole): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
    console.log('AuthContext: Attempting sign up for:', email, 'with role:', roleToSet);
    if (!roleToSet) {
        return { success: false, message: 'Role is required for signup.', user: null };
    }
    setLoading(true);
    try {
        const result = await signUpUserAction(email, pass, name, roleToSet);
        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            console.log('AuthContext: Sign up successful.', {id: result.user.id, role: result.user.role, onboardingCompleted: result.user.onboardingCompleted });
            return { success: true, message: result.message, user: result.user };
        } else {
            console.log('AuthContext: Sign up failed:', result.message);
            return { success: false, message: result.message || 'Signup failed.', user: null };
        }
    } catch (error: any) {
        console.error("AuthContext: Sign up process failed:", error);
        return { success: false, message: error.message || 'An unexpected error occurred during signup.', user: null };
    } finally {
        setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('AuthContext: Signing out');
    setLoading(true);
    setUser(null);
    setRole(null);
    sessionStorage.removeItem('loggedInUser');
    await sleep(100); 
    setLoading(false); 
    router.push('/login');
    console.log('AuthContext: Sign out complete, redirected to /login');
  }, [router]);

  const setRoleAndUpdateUser = useCallback(async (roleToSet: UserRole): Promise<{ success: boolean; message: string }> => {
     if (!user) return { success: false, message: 'User not logged in.' };
     if (!roleToSet) return { success: false, message: 'Invalid role selected.' };
     setLoading(true);
     try {
        const result = await updateUserRole(user.id, roleToSet);
        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            console.log(`AuthContext: Role updated to ${roleToSet} for user ${user.id}.`);
            return { success: true, message: result.message };
        } else {
            return { success: false, message: result.message || 'Failed to update role.'};
        }
     } catch (error: any) {
        return { success: false, message: error.message || 'Failed to update role.'};
     } finally {
        setLoading(false);
     }
   }, [user]);

   const updateProfilePicture = useCallback(async (imageDataUri: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
     if (!user) return { success: false, message: 'User not logged in.' };
     setLoading(true);
     try {
       const result = await updateUserProfilePictureAction(user.id, imageDataUri);
       if (result.success && result.user) {
         setUser(result.user);
         sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
         return { success: true, message: result.message, user: result.user };
       } else {
         return { success: false, message: result.message || 'Failed to update profile picture.', user: null };
       }
     } catch (error: any) {
       return { success: false, message: error.message || 'Failed to update profile picture.', user: null };
     } finally {
       setLoading(false);
     }
   }, [user]);

  const updateUserProfile = useCallback(async (profileData: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'skills' | 'causes' | 'onboardingCompleted'>>): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
    if (!user) return { success: false, message: 'User not logged in.' };
    setLoading(true);
    try {
      const result = await updateUserProfileBioSkillsCausesAction(user.id, profileData);
      if (result.success && result.user) {
        setUser(result.user);
        setRole(result.user.role);
        sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
        return { success: true, message: result.message, user: result.user };
      } else {
        return { success: false, message: result.message || 'Failed to update profile.', user: null };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update profile.', user: null };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const sendPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    try {
        const result = await sendPasswordResetEmailAction(email);
        return result;
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to send password reset email." };
    } finally {
        setLoading(false);
    }
  }, []);


   const addPointsAndUpdateContext = useCallback(async (userId: string, points: number, reason: string): Promise<{success: boolean, newStats?: VolunteerStats | null}> => {
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
             return { success: false, newStats: null };
         }
       } catch (error: any) {
           return { success: false, newStats: null };
       }
   }, [user]);

    const awardBadgeAndUpdateContext = useCallback(async (userId: string, badgeName: string, reason: string): Promise<{success: boolean, newStats?: VolunteerStats | null}> => {
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
               return { success: false, newStats: null };
          }
        } catch (error: any) {
            return { success: false, newStats: null };
        }
    }, [user]);

    const logHoursAndUpdateContext = useCallback(async (userId: string, hours: number, reason: string): Promise<{success: boolean, newStats?: VolunteerStats | null}> => {
        try {
            const result = await logHoursAction(userId, hours, reason);
            if (result.success) {
                if (user && user.id === userId && result.newStats) {
                    const updatedUser = { ...user, stats: result.newStats };
                    setUser(updatedUser);
                    sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
                }
                return { success: true, newStats: result.newStats };
            } else {
                return { success: false, newStats: null };
            }
        } catch (error: any) {
            return { success: false, newStats: null };
        }
    }, [user]);


  const submitApplication = useCallback(async (applicationData: Omit<VolunteerApplication, 'id' | 'status' | 'submittedAt' | 'volunteerId'>): Promise<{ success: boolean; message: string }> => {
    if (!user || user.role !== 'volunteer') {
      return { success: false, message: 'Only logged-in volunteers can apply.' };
    }
    setLoading(true);
    try {
      const submitResult = await submitVolunteerApplicationAction(applicationData, user.id, user.displayName || user.email);
      if (submitResult.success) {
        await addPointsAndUpdateContext(user.id, 5, `Applied for opportunity: ${applicationData.opportunityTitle}`);
        return { success: true, message: submitResult.message };
      } else {
         return { success: false, message: submitResult.message || 'Application submission failed.' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Application submission failed.' };
    } finally {
      setLoading(false);
    }
  }, [user, addPointsAndUpdateContext]);

  const acceptApplication = useCallback(async (applicationId: string, volunteerId: string): Promise<{ success: boolean; message: string; conversationId?: string, updatedApp?: VolunteerApplication | null }> => {
     if (!user || user.role !== 'organization') {
       return { success: false, message: 'Only logged-in organizations can accept applications.' };
     }
     setLoading(true);
     try {
        const result = await acceptVolunteerApplication(applicationId, volunteerId, user.id, user.displayName);
        return result;
     } catch (error: any) {
       return { success: false, message: error.message || 'Failed to accept application.', updatedApp: null };
     } finally {
       setLoading(false);
     }
   }, [user]);

  const rejectApplication = useCallback(async (applicationId: string): Promise<{ success: boolean; message: string; updatedApp?: VolunteerApplication | null }> => {
       if (!user || user.role !== 'organization') {
           return { success: false, message: 'Only logged-in organizations can reject applications.' };
       }
       setLoading(true);
       try {
           const result = await rejectVolunteerApplication(applicationId);
           return result;
       } catch (error: any) {
           return { success: false, message: error.message || 'Failed to reject application.', updatedApp: null };
       } finally {
           setLoading(false);
       }
   }, [user]);

   const recordVolunteerPerformance = useCallback(async (
        applicationId: string,
        performanceData: {
            attendance: 'present' | 'absent' | 'pending';
            orgRating?: number;
            hoursLoggedByOrg?: number;
        }
    ): Promise<{ success: boolean; message: string; updatedApplication?: VolunteerApplication | null }> => {
        if (!user || user.role !== 'organization') {
            return { success: false, message: 'Only organizations can record performance.' };
        }
        setLoading(true);
        try {
            const result = await recordVolunteerPerformanceAction(applicationId, performanceData);
            // Points and hours logging are now handled within recordVolunteerPerformanceAction based on the service's response
            return result;
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to record performance.', updatedApplication: null };
        } finally {
            setLoading(false);
        }
   }, [user]);

    const getUserConversations = useCallback(async (): Promise<(Conversation & { unreadCount: number })[]> => {
        if (!user || !user.role) return [];
        setLoading(true);
        try {
          return await getUserConversationsAction(user.id, user.role);
        } catch (error: any) {
          return [];
        } finally {
          setLoading(false);
        }
      }, [user]);

    const getConversationDetails = useCallback(async (conversationId: string): Promise<{ conversation: Conversation; messages: Message[] } | { error: string }> => {
        if (!user || !user.role) return { error: 'User not authenticated or role not set.' };
        setLoading(true);
        try {
            return await getConversationDetailsAction(conversationId, user.id, user.role);
        } catch (error: any) {
            return { error: error.message || 'Failed to fetch conversation details.' };
        } finally {
            setLoading(false);
        }
    }, [user]);

    const sendMessage = useCallback(async (conversationId: string, text: string): Promise<{ success: boolean; message?: Message; error?: string }> => {
        if (!user) return { success: false, error: 'User not authenticated.' };
        if (!text.trim()) return { success: false, error: "Message text cannot be empty." };
        setLoading(true);
        try {
            return await sendMessageAction(conversationId, user.id, text);
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to send message.' };
        } finally {
            setLoading(false);
        }
    }, [user]);


    const startConversation = useCallback(async (data: {
        organizationId: string;
        opportunityId: string;
        initialMessage: string;
        opportunityTitle?: string;
        organizationName?: string;
        volunteerName?: string;
      }): Promise<{ success: boolean; conversation?: Conversation; error?: string }> => {
        if (!user || (user.role !== 'volunteer' && user.role !== 'organization')) { // Allow orgs to also start convos if needed (e.g. from a volunteer list)
            return { success: false, error: 'User not authorized to start conversations or not logged in.' };
        }
        if (!data.initialMessage.trim()) return { success: false, error: "Initial message cannot be empty." };
        setLoading(true);
        try {
            // Ensure volunteerId is correctly passed based on who is starting the conversation
            // The startConversationAction needs to correctly assign senderId of the initial message
            const payload = {
                ...data,
                volunteerId: user.role === 'volunteer' ? user.id : (data.volunteerId || ''), // If org starts, volunteerId must be in `data`
                volunteerName: user.role === 'volunteer' ? user.displayName : data.volunteerName,
                organizationId: user.role === 'organization' ? user.id : data.organizationId,
                organizationName: user.role === 'organization' ? user.displayName : data.organizationName,
            };
            if (!payload.volunteerId && user.role === 'organization') {
                return {success: false, error: "Volunteer ID is required for an organization to start a conversation."}
            }

            return await startConversationAction(payload);
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to start conversation.' };
        } finally {
            setLoading(false);
        }
    }, [user]);


  if (loading && !isClientHydrated) { // Only show full-page spinner during initial server render or first client load before hydration
    return (
       <div className="flex items-center justify-center min-h-screen bg-secondary">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
    );
  }
  // After client hydration, if still loading (e.g., session restoration), show minimal or no UI for auth pages
  if (loading && isClientHydrated && (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password')) {
      return null; // Or a very minimal placeholder like <div />
  }
  // If loading for other pages after hydration, show spinner
  if (loading && isClientHydrated) {
       return (
         <div className="flex items-center justify-center min-h-screen bg-secondary">
           <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
        updateProfilePicture,
        updateUserProfile,
        sendPasswordReset,
        submitApplication,
        acceptApplication,
        rejectApplication,
        recordVolunteerPerformance,
        getUserConversations,
        getConversationDetails,
        sendMessage,
        startConversation,
        addPoints: addPointsAndUpdateContext,
        awardBadge: awardBadgeAndUpdateContext,
        logHours: logHoursAndUpdateContext,
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
