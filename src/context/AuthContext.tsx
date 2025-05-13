// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Import types/interfaces
import type { VolunteerApplication, Opportunity } from '@/services/job-board';
import type { Conversation } from '@/services/messaging';
import type { VolunteerStats } from '@/services/gamification';
import type { AdminReport } from '@/services/admin';


// Import server actions
import {
    signInUser as signInUserAction,
    signUpUser as signUpUserAction,
    updateUserRole,
    getRefreshedUserAction,
    updateUserProfilePictureAction,
    updateUserProfileBioSkillsCausesAction, // Corrected import alias usage
    sendPasswordResetEmailAction, // For local password reset
    reportUserAction, // For reporting a user
} from '@/actions/auth-actions';
import {
    getReportedUsersAction, // For admin to fetch reports
    resolveReportAction   // For admin to resolve reports
} from '@/actions/admin-actions';
import {
    acceptVolunteerApplication,
    rejectVolunteerApplication,
    submitVolunteerApplicationAction,
    recordVolunteerPerformanceAction,
} from '@/actions/application-actions';
import { getOpportunityByIdAction } from '@/actions/job-board-actions';
import { addPointsAction, awardBadgeAction, logHoursAction } from '@/actions/gamification-actions';
import { getUserConversationsAction, startConversationAction } from '@/actions/messaging-actions';


export type UserRole = 'volunteer' | 'organization' | 'admin' | null;

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  hashedPassword?: string; // For local auth, not sent to client
  stats?: VolunteerStats;
  profilePictureUrl?: string;
  bio?: string;
  skills?: string[];
  causes?: string[];
  onboardingCompleted?: boolean;
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
  startConversation: (data: {
    organizationId: string;
    opportunityId: string;
    initialMessage: string;
    opportunityTitle?: string;
    organizationName?: string;
  }) => Promise<{ success: boolean; conversation?: Conversation; error?: string }>;
  addPoints: (userId: string, points: number, reason: string) => Promise<{success: boolean, newStats?: VolunteerStats | null}>;
  awardBadge: (userId: string, badgeName: string, reason: string) => Promise<{success: boolean, newStats?: VolunteerStats | null}>;
  logHours: (userId: string, hours: number, reason: string) => Promise<{success: boolean, newStats?: VolunteerStats | null}>;
  reportUser: (reportedUserId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  getReportedUsers: () => Promise<AdminReport[]>;
  resolveReport: (reportId: string, adminNotes: string) => Promise<{ success: boolean; message: string; report?: AdminReport | null }>;
  getOpportunityDetails: (opportunityId: string) => Promise<Opportunity | undefined>;
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

  const isAuthPage = useCallback(() => {
    return pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
  }, [pathname]);

  useEffect(() => {
    setIsClientHydrated(true);
    const restoreSession = async () => {
        console.log('AuthProvider: Checking sessionStorage for existing session.');
        setLoading(true);
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            try {
                const parsedUser: UserProfile = JSON.parse(storedUser);
                // Don't store/restore password from session storage
                const { hashedPassword, ...userToRestore } = parsedUser;
                setUser(userToRestore);
                setRole(userToRestore.role);
                console.log('AuthProvider: Restored basic user session from sessionStorage.', {id: userToRestore.id, role: userToRestore.role});

                const refreshResult = await getRefreshedUserAction(userToRestore.id);
                if (refreshResult.success && refreshResult.user) {
                    const { hashedPassword: _, ...refreshedUser } = refreshResult.user;
                    setUser(refreshedUser);
                    setRole(refreshedUser.role);
                    sessionStorage.setItem('loggedInUser', JSON.stringify(refreshedUser)); // Store refreshed user without password
                    console.log('AuthProvider: Successfully refreshed user session from server.', {id: refreshedUser.id, role: refreshedUser.role});
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
      isAuthPage: isAuthPage(),
    });

    if (loading) return;

    const isSelectRolePage = pathname === '/select-role';
    const isOnboardingPage = pathname === '/onboarding';
    const isRootPage = pathname === '/'; // Keep for specific root redirect logic if any

    if (user) {
      const targetDashboard = role === 'admin' ? '/admin' : (role === 'organization' ? '/dashboard/organization' : '/dashboard/volunteer');
      console.log(`AuthContext: User is present. Role: ${role}. Target Dashboard: ${targetDashboard}`);

      if (role) { // User has a role (volunteer, organization, or admin)
        if (user.onboardingCompleted === false && !isOnboardingPage && role !== 'admin') { // Admins skip onboarding
          console.log(`AuthContext: User role ${role}, onboarding not complete. Redirecting to /onboarding.`);
          router.push('/onboarding');
        } else if (isAuthPage() || isSelectRolePage || (isOnboardingPage && user.onboardingCompleted)) {
          console.log(`AuthContext: Current path ${pathname} is auth/select-role/completed-onboarding. Redirecting to ${targetDashboard}.`);
          router.push(targetDashboard);
        } else {
          console.log(`AuthContext: User on ${pathname}. No automatic redirect to dashboard needed based on current logic.`);
        }
      } else if (!isSelectRolePage && !isOnboardingPage) { // User exists but has no role (shouldn't happen after signup typically)
        console.log(`AuthContext: User has no role. Current path ${pathname}. Redirecting to /select-role.`);
        router.push('/select-role');
      } else {
         console.log(`AuthContext: User has no role, but is already on /select-role or /onboarding. No redirect needed.`);
      }
    } else { // No user
      console.log('AuthContext: User is not present.');
      const protectedRoutes = ['/dashboard', '/profile/edit', '/notifications', '/select-role', '/apply', '/chatbot', '/messages', '/onboarding', '/admin'];
      if (protectedRoutes.some(p => pathname.startsWith(p)) && !isAuthPage()) {
         console.log(`AuthProvider: User not logged in. Current path ${pathname} is protected. Redirecting to /login.`);
         router.push('/login');
      } else {
        console.log(`AuthContext: User not present. Path ${pathname} is not protected or is an auth page. No redirect.`);
      }
    }
  }, [user, role, loading, router, pathname, isAuthPage]);


  const signIn = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
    console.log('AuthContext: Attempting sign in for:', email);
    setLoading(true);
    try {
        const result = await signInUserAction(email, pass);
        if (result.success && result.user) {
            const { hashedPassword, ...userToStore } = result.user; // Exclude password from client state
            setUser(userToStore);
            setRole(userToStore.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(userToStore));
            console.log('AuthContext: Sign in successful. User and role set.', {id: userToStore.id, role: userToStore.role });
            return { success: true, message: result.message, user: userToStore };
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
            const { hashedPassword, ...userToStore } = result.user; // Exclude password
            setUser(userToStore);
            setRole(userToStore.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(userToStore));
            console.log('AuthContext: Sign up successful.', {id: userToStore.id, role: userToStore.role, onboardingCompleted: userToStore.onboardingCompleted });
            return { success: true, message: result.message, user: userToStore };
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
    router.push('/login');
    setLoading(false); // Set loading false *after* push to ensure redirect logic doesn't interfere
    console.log('AuthContext: Sign out complete, redirected to /login');
  }, [router]);

  const setRoleAndUpdateUser = useCallback(async (roleToSet: UserRole): Promise<{ success: boolean; message: string }> => {
     if (!user) return { success: false, message: 'User not logged in.' };
     if (!roleToSet || !['volunteer', 'organization', 'admin'].includes(roleToSet)) { // Include admin
        return { success: false, message: 'Invalid role selected.' };
     }
     setLoading(true);
     try {
        const result = await updateUserRole(user.id, roleToSet);
        if (result.success && result.user) {
            const { hashedPassword, ...userToStore } = result.user;
            setUser(userToStore);
            setRole(userToStore.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(userToStore));
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
         const { hashedPassword, ...userToStore } = result.user;
         setUser(userToStore);
         sessionStorage.setItem('loggedInUser', JSON.stringify(userToStore));
         return { success: true, message: result.message, user: userToStore };
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
        const { hashedPassword, ...userToStore } = result.user;
        setUser(userToStore);
        setRole(userToStore.role);
        sessionStorage.setItem('loggedInUser', JSON.stringify(userToStore));
        return { success: true, message: result.message, user: userToStore };
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
    console.log(`AuthContext: Password reset initiated for ${email}`);
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
               setUser(updatedUser); // Client state user doesn't have hashedPassword
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
            if (result.success && result.updatedApplication?.attendance === 'present') {
                if (performanceData.hoursLoggedByOrg && performanceData.hoursLoggedByOrg > 0) {
                    await logHoursAndUpdateContext(result.updatedApplication.volunteerId, performanceData.hoursLoggedByOrg, `Volunteered for ${result.updatedApplication.opportunityTitle}`);
                }
                // Points for completion and rating bonus are handled within recordVolunteerPerformanceAction itself
            }
            return result;
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to record performance.', updatedApplication: null };
        } finally {
            setLoading(false);
        }
   }, [user, logHoursAndUpdateContext]);

    const getUserConversations = useCallback(async (): Promise<(Conversation & { unreadCount: number })[]> => {
        if (!user || !user.id || !user.role) {
            console.log("AuthContext: Cannot fetch conversations - missing user ID or role");
            return [];
        }
        
        // Admins don't have conversations in the current system design
        if (user.role === 'admin') {
            console.log("AuthContext: Admin users don't have conversations");
            return [];
        }
        
        try {
            return await getUserConversationsAction(user.id, user.role as 'volunteer' | 'organization');
        } catch (error: any) {
            console.error("AuthContext: Error fetching user conversations:", error);
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
        if (!data.initialMessage.trim()) return { success: false, error: "Initial message cannot be empty." };
        setLoading(true);
        try {
            return await startConversationAction({
                ...data,
                volunteerId: user.id,
                volunteerName: user.displayName,
            });
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to start conversation.' };
        } finally {
            setLoading(false);
        }
    }, [user]);

    const reportUser = useCallback(async (reportedUserId: string, reason: string): Promise<{ success: boolean; message: string }> => {
      if (!user) return { success: false, message: 'You must be logged in to report a user.' };
      setLoading(true);
      try {
        return await reportUserAction(user.id, reportedUserId, reason);
      } catch (error: any) {
        return { success: false, message: error.message || 'Failed to report user.' };
      } finally {
        setLoading(false);
      }
    }, [user]);

    const getReportedUsers = useCallback(async (): Promise<AdminReport[]> => {
      if (!user || user.role !== 'admin') {
        console.error("Unauthorized attempt to get reported users.");
        return [];
      }
      try {
        return await getReportedUsersAction();
      } catch (error) {
        console.error("Failed to get reported users:", error);
        return [];
      }
    }, [user]);

  const resolveReport = useCallback(async (reportId: string, adminNotes: string): Promise<{ success: boolean; message: string; report?: AdminReport | null }> => {
      if (!user || user.role !== 'admin') {
          return { success: false, message: "Unauthorized action." };
      }
      setLoading(true);
      try {
          const result = await resolveReportAction(reportId, adminNotes, user.id);
          return result;
      } catch (error: any) {
          return { success: false, message: error.message || 'Failed to resolve report.' };
      } finally {
          setLoading(false);
      }
  }, [user]);

  const getOpportunityDetails = useCallback(async (opportunityId: string): Promise<Opportunity | undefined> => {
    if (!user) {
      console.log("User not authenticated to fetch opportunity details.");
      return undefined;
    }
    try {
      return await getOpportunityByIdAction(opportunityId);
    } catch (error) {
      console.error(`Failed to fetch opportunity ${opportunityId}:`, error);
      return undefined;
    }
  }, [user]);


  if (loading && !isClientHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  // If still loading initial session info (after hydration), show loader for non-auth pages
  if (loading && !isAuthPage() && isClientHydrated) {
       return (
         <div className="flex items-center justify-center min-h-screen bg-secondary">
           <Loader2 className="h-12 w-12 animate-spin text-primary" />
         </div>
       );
  }
  // For auth pages, if still loading, render nothing to prevent flicker or show very minimal placeholder
  if (loading && isAuthPage() && isClientHydrated) {
    return null;
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
        startConversation,
        addPoints: addPointsAndUpdateContext,
        awardBadge: awardBadgeAndUpdateContext,
        logHours: logHoursAndUpdateContext,
        reportUser,
        getReportedUsers,
        resolveReport,
        getOpportunityDetails,
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
