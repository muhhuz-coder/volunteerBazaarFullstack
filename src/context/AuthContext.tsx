// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Import types/interfaces
import type { VolunteerApplication } from '@/services/job-board';
import type { Conversation } from '@/services/messaging';
import type { VolunteerStats } from '@/services/gamification';
import type { Report } from '@/services/user-service';

// Import server actions
import {
    signInUser as signInUserAction,
    signUpUser as signUpUserAction,
    updateUserRole,
    getRefreshedUserAction,
    updateUserProfilePictureAction,
    updateUserProfileBioSkillsCauses as updateUserProfileBioSkillsCausesAction,
    sendPasswordResetEmailAction,
    suspendUserAccount as suspendUserAccountAction,
    unsuspendUserAccount as unsuspendUserAccountAction,
} from '@/actions/auth-actions';
import {
    acceptVolunteerApplication,
    rejectVolunteerApplication,
    submitVolunteerApplicationAction,
    recordVolunteerPerformanceAction
} from '@/actions/application-actions';
import { addPointsAction, awardBadgeAction, logHoursAction } from '@/actions/gamification-actions';
import { getUserConversationsAction, startConversationAction } from '@/actions/messaging-actions';
import { blockUserAction, unblockUserAction, reportUserAction as submitReportUserAction } from '@/actions/user-actions';


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
  blockedUserIds?: string[];
  isSuspended?: boolean;
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
  blockUser: (userIdToBlock: string) => Promise<{ success: boolean; message: string; updatedUser?: UserProfile | null }>;
  unblockUser: (userIdToUnblock: string) => Promise<{ success: boolean; message: string; updatedUser?: UserProfile | null }>;
  reportUser: (reportedUserId: string, reason: string, details?: string) => Promise<{ success: boolean; message: string, report?: Report | null }>;
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

  const signIn = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
    let success = false;
    let message = '';
    let finalUser: UserProfile | null = null;

    console.log('AuthContext: Attempting sign in for:', email);
    setLoading(true);
    try {
        const result = await signInUserAction(email, pass);
        if (result.success && result.user) {
            if (result.user.isSuspended) {
                message = 'Your account has been suspended. Please contact support.';
            } else {
                finalUser = result.user;
                success = true;
                message = result.message;
                console.log('AuthContext: Sign in action successful. User data prepared.', {id: result.user.id, role: result.user.role });
            }
        } else {
            message = result.message || 'Invalid credentials.';
        }
    } catch (error: any) {
        message = error.message || 'An unexpected error occurred during login.';
        console.error("AuthContext: Sign in process failed:", error);
    } finally {
        if (success && finalUser) {
            setUser(finalUser);
            setRole(finalUser.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(finalUser));
        } else {
            setUser(null);
            setRole(null);
            sessionStorage.removeItem('loggedInUser');
        }
        setLoading(false);
    }
    return { success, message, user: finalUser };
  }, []);

  const signUp = useCallback(async (email: string, pass: string, name: string, roleToSet: UserRole): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
    let success = false;
    let message = '';
    let finalUser: UserProfile | null = null;
    console.log('AuthContext: Attempting sign up for:', email, 'with role:', roleToSet);
    if (!roleToSet) {
        return { success: false, message: 'Role is required for signup.', user: null };
    }
    setLoading(true);
    try {
        const result = await signUpUserAction(email, pass, name, roleToSet);
        if (result.success && result.user) {
            finalUser = result.user;
            success = true;
            message = result.message;
            console.log('AuthContext: Sign up successful.', {id: result.user.id, role: result.user.role, onboardingCompleted: result.user.onboardingCompleted });
        } else {
            message = result.message || 'Signup failed.';
            console.log('AuthContext: Sign up failed:', result.message);
        }
    } catch (error: any) {
        message = error.message || 'An unexpected error occurred during signup.';
        console.error("AuthContext: Sign up process failed:", error);
    } finally {
        if (success && finalUser) {
            setUser(finalUser);
            setRole(finalUser.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(finalUser));
        } else {
            setUser(null);
            setRole(null);
            sessionStorage.removeItem('loggedInUser');
        }
        setLoading(false);
    }
    return { success, message, user: finalUser };
  }, []);

  const setRoleAndUpdateUser = useCallback(async (roleToSet: UserRole): Promise<{ success: boolean; message: string }> => {
     if (!user) return { success: false, message: 'User not logged in.' };
     if (!roleToSet) return { success: false, message: 'Invalid role selected.' };
     let success = false;
     let message = '';
     setLoading(true);
     try {
        const result = await updateUserRole(user.id, roleToSet);
        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            console.log(`AuthContext: Role updated to ${roleToSet} for user ${user.id}.`);
            success = true;
            message = result.message;
        } else {
            message = result.message || 'Failed to update role.';
        }
     } catch (error: any) {
        message = error.message || 'Failed to update role.';
     } finally {
        setLoading(false);
     }
     return { success, message };
   }, [user]);

   const updateProfilePicture = useCallback(async (imageDataUri: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
     if (!user) return { success: false, message: 'User not logged in.', user: null };
     setLoading(true);
     try {
       const result = await updateUserProfilePictureAction(user.id, imageDataUri);
       if (result.success && result.user) {
         setUser(result.user);
         sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
         return { success: true, message: result.message, user: result.user };
       }
       return { success: false, message: result.message || 'Failed to update profile picture.', user: null };
     } catch (error: any) {
       return { success: false, message: error.message || 'Failed to update profile picture.', user: null };
     } finally {
       setLoading(false);
     }
   }, [user]);

  const updateUserProfile = useCallback(async (profileData: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'skills' | 'causes' | 'onboardingCompleted'>>): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
    if (!user) return { success: false, message: 'User not logged in.', user: null };
    setLoading(true);
    try {
      const result = await updateUserProfileBioSkillsCausesAction(user.id, profileData);
      if (result.success && result.user) {
        setUser(result.user);
        setRole(result.user.role); 
        sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
        return { success: true, message: result.message, user: result.user };
      }
      return { success: false, message: result.message || 'Failed to update profile.', user: null };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update profile.', user: null };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const sendPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    try {
        return await sendPasswordResetEmailAction(email);
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
         }
         // @ts-ignore
         return { success: false, newStats: null, message: result.message };
       } catch (error: any) {
           return { success: false, newStats: null, message: error.message };
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
          }
           // @ts-ignore
          return { success: false, newStats: null, message: result.message };
        } catch (error: any) {
            return { success: false, newStats: null, message: error.message };
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
            }
             // @ts-ignore
            return { success: false, newStats: null, message: result.message };
        } catch (error: any) {
            return { success: false, newStats: null, message: error.message };
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
      }
      return { success: false, message: submitResult.message || 'Application submission failed.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Application submission failed.' };
    } finally {
      setLoading(false);
    }
  }, [user, addPointsAndUpdateContext]);

  const acceptApplication = useCallback(async (applicationId: string, volunteerId: string): Promise<{ success: boolean; message: string; conversationId?: string, updatedApp?: VolunteerApplication | null }> => {
     if (!user || user.role !== 'organization') {
       return { success: false, message: 'Only logged-in organizations can accept applications.', updatedApp: null };
     }
     setLoading(true);
     try {
        return await acceptVolunteerApplication(applicationId, volunteerId, user.id, user.displayName);
     } catch (error: any) {
       return { success: false, message: error.message || 'Failed to accept application.', updatedApp: null };
     } finally {
       setLoading(false);
     }
   }, [user]);

  const rejectApplication = useCallback(async (applicationId: string): Promise<{ success: boolean; message: string; updatedApp?: VolunteerApplication | null }> => {
       if (!user || user.role !== 'organization') {
           return { success: false, message: 'Only logged-in organizations can reject applications.', updatedApp: null };
       }
       setLoading(true);
       try {
           return await rejectVolunteerApplication(applicationId);
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
            return { success: false, message: 'Only organizations can record performance.', updatedApplication: null };
        }
        setLoading(true);
        try {
            return await recordVolunteerPerformanceAction(applicationId, performanceData);
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to record performance.', updatedApplication: null };
        } finally {
            setLoading(false);
        }
   }, [user]);

    const getUserConversations = useCallback(async (): Promise<(Conversation & { unreadCount: number })[]> => {
        if (!user || !user.role) return [];
        try {
          return await getUserConversationsAction(user.id, user.role);
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

  const blockUser = useCallback(async (userIdToBlock: string): Promise<{ success: boolean; message: string; updatedUser?: UserProfile | null }> => {
    if (!user) return { success: false, message: 'User not logged in.', updatedUser: null };
    setLoading(true);
    try {
      const result = await blockUserAction(user.id, userIdToBlock);
      if (result.success && result.user) {
        setUser(result.user);
        sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
      }
      return { success: result.success, message: result.message, updatedUser: result.user };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to block user.', updatedUser: null };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unblockUser = useCallback(async (userIdToUnblock: string): Promise<{ success: boolean; message: string; updatedUser?: UserProfile | null }> => {
    if (!user) return { success: false, message: 'User not logged in.', updatedUser: null };
    setLoading(true);
    try {
      const result = await unblockUserAction(user.id, userIdToUnblock);
      if (result.success && result.user) {
        setUser(result.user);
        sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
      }
      return { success: result.success, message: result.message, updatedUser: result.user };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to unblock user.', updatedUser: null };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const reportUser = useCallback(async (reportedUserId: string, reason: string, details?: string): Promise<{ success: boolean; message: string, report?: Report | null }> => {
    if (!user) return { success: false, message: 'User not logged in.', report: null };
    setLoading(true);
    try {
      return await submitReportUserAction(user.id, user.displayName, reportedUserId, reason, details);
    } catch (error: any)      {
      return { success: false, message: error.message || 'Failed to submit report.', report: null };
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setIsClientHydrated(true);
    const restoreSession = async () => {
        console.log('AuthProvider: Checking sessionStorage for existing session.');
        setLoading(true);
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            try {
                const parsedUser: UserProfile = JSON.parse(storedUser);
                
                if (parsedUser.isSuspended) {
                    console.log('AuthProvider: User account is suspended from stored data. Clearing session.');
                    sessionStorage.removeItem('loggedInUser');
                    setUser(null); setRole(null);
                    router.push('/login?error=suspended');
                    setLoading(false); return;
                }

                setUser(parsedUser); setRole(parsedUser.role);
                console.log('AuthProvider: Restored basic user session from sessionStorage.', {id: parsedUser.id, role: parsedUser.role});

                const refreshResult = await getRefreshedUserAction(parsedUser.id);
                if (refreshResult.success && refreshResult.user) {
                    if (refreshResult.user.isSuspended) {
                        console.log('AuthProvider: User account is suspended (checked on refresh). Clearing session.');
                        sessionStorage.removeItem('loggedInUser');
                        setUser(null); setRole(null);
                        router.push('/login?error=suspended_on_refresh');
                    } else {
                        setUser(refreshResult.user);
                        setRole(refreshResult.user.role);
                        sessionStorage.setItem('loggedInUser', JSON.stringify(refreshResult.user));
                        console.log('AuthProvider: Successfully refreshed user session from server.', {id: refreshResult.user.id, role: refreshResult.user.role});
                    }
                } else {
                    console.warn('AuthProvider: Failed to refresh user session. Using stored data or logging out.', refreshResult.message);
                    sessionStorage.removeItem('loggedInUser');
                    setUser(null); setRole(null);
                    router.push('/login?error=session_expired');
                }
            } catch (e) {
                console.error("AuthProvider: Error processing stored user session.", e);
                sessionStorage.removeItem('loggedInUser');
                setUser(null); setRole(null);
            }
        } else {
            console.log('AuthProvider: No user session found in sessionStorage.');
            setUser(null); setRole(null);
        }
        setLoading(false);
    };
    if (typeof window !== "undefined") {
        restoreSession();
    } else {
        setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    console.log('AuthContext redirection useEffect triggered. State:', {
      loading,
      userId: user ? user.id : null,
      role,
      pathname,
      onboardingCompleted: user?.onboardingCompleted,
      isSuspended: user?.isSuspended,
    });

    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
    const isSelectRolePage = pathname === '/select-role';
    const isOnboardingPage = pathname === '/onboarding';
    const isAdminPage = pathname.startsWith('/admin');
    // const isRootPage = pathname === '/'; // No longer needed for redirect from root

    if (user) { 
      if (user.isSuspended) {
        if (pathname !== '/login') { 
            console.log(`AuthContext: User ${user.id} is suspended. Logging out and redirecting to /login.`);
            signOut(); 
        }
        return; 
      }

      if (!role) { 
        if (!isSelectRolePage && !isOnboardingPage && !isAdminPage) { 
          console.log(`AuthContext: User ${user.id} has no role. Current path ${pathname}. Redirecting to /select-role.`);
          router.push('/select-role');
        } else {
          console.log(`AuthContext: User ${user.id} has no role, but on an allowed page ${pathname}. No redirect.`);
        }
        return; 
      }

      
      if (user.onboardingCompleted === false) { 
        if (!isOnboardingPage) { 
          console.log(`AuthContext: User ${user.id} (Role: ${role}) onboarding incomplete. Redirecting to /onboarding.`);
          router.push('/onboarding');
        } else {
          console.log(`AuthContext: User ${user.id} (Role: ${role}) onboarding incomplete, but on onboarding page. No redirect.`);
        }
        return; 
      }

      
      const targetDashboard = role === 'admin' ? '/admin'
                              : role === 'organization' ? '/dashboard/organization'
                              : '/dashboard/volunteer';

      
      if (isAuthPage || isSelectRolePage || isOnboardingPage) {
        if (pathname !== targetDashboard) { 
          console.log(`AuthContext: User ${user.id} (Role: ${role}, Onboarded) on preliminary page ${pathname}. Redirecting to ${targetDashboard}.`);
          router.push(targetDashboard);
        }
        return; 
      }

      
      if (role === 'admin') {
        if (!isAdminPage && pathname !== targetDashboard) { 
          console.log(`AuthContext: Admin user ${user.id} on non-admin page (${pathname}). Redirecting to ${targetDashboard}.`);
          router.push(targetDashboard);
        }
        return; 
      }
      
      
      if (isAdminPage) { 
        console.log(`AuthContext: Non-admin user ${user.id} attempting to access admin page ${pathname}. Redirecting to ${targetDashboard}.`);
        router.push(targetDashboard);
        return;
      }
      
            
      if (pathname.startsWith('/dashboard/') && !pathname.startsWith(targetDashboard)) {
          console.log(`AuthContext: User ${user.id} (Role: ${role}) on incorrect dashboard page ${pathname}. Redirecting to ${targetDashboard}.`);
          router.push(targetDashboard);
          return;
      }
      console.log(`AuthContext: User ${user.id} (Role: ${role}, Onboarded) on ${pathname}. Path is acceptable. No redirect.`);

    } else { 
      console.log('AuthContext: User is not present and not loading.');
      const protectedRoutes = ['/dashboard', '/profile/edit', '/notifications', '/select-role', '/apply', '/chatbot', '/messages', '/onboarding', '/admin'];
      if (protectedRoutes.some(p => pathname.startsWith(p)) && !isAuthPage ) { 
         console.log(`AuthProvider: User not logged in. Current path ${pathname} is protected. Redirecting to /login.`);
         router.push('/login');
      } else {
        console.log(`AuthContext: User not present, not loading. Path ${pathname}. No redirect for unauthenticated user here.`);
      }
    }
  }, [user, role, loading, router, pathname, signOut]);


  if (loading && !isClientHydrated) { 
    return null; 
  }

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
        startConversation,
        addPoints: addPointsAndUpdateContext,
        awardBadge: awardBadgeAndUpdateContext,
        logHours: logHoursAndUpdateContext,
        blockUser,
        unblockUser,
        reportUser,
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
