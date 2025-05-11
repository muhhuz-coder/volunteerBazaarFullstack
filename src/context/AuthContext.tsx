
// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Ensure usePathname is imported
import { Skeleton } from '@/components/ui/skeleton';
// Import types/interfaces from services
import type { VolunteerApplication, Opportunity } from '@/services/job-board';
import type { Conversation } from '@/services/messaging';
import type { VolunteerStats } from '@/services/gamification';

// Import server actions that will handle data persistence
import { signInUser, signUpUser, updateUserRole, getRefreshedUserAction, updateUserProfilePictureAction } from '@/actions/auth-actions';
import { acceptVolunteerApplication, rejectVolunteerApplication, submitVolunteerApplicationAction, recordVolunteerPerformanceAction } from '@/actions/application-actions';
import { addPointsAction, awardBadgeAction, logHoursAction } from '@/actions/gamification-actions';
import { getUserConversationsAction, startConversationAction } from '@/actions/messaging-actions';


export type UserRole = 'volunteer' | 'organization' | null;

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  stats?: VolunteerStats;
  profilePictureUrl?: string;
  // Optional fields for extended profile
  bio?: string;
  skills?: string[];
  causes?: string[];
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
  updateUserProfile: (profileData: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'skills' | 'causes'>>) => Promise<{ success: boolean; message: string; user?: UserProfile | null }>;
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
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  useEffect(() => {
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
    restoreSession();
  }, []);

  useEffect(() => {
    console.log('AuthContext redirection useEffect triggered. State:', {
      loading,
      userId: user ? user.id : null,
      role,
      pathname,
    });

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
    const isSelectRolePage = pathname === '/select-role';
    const isRootPage = pathname === '/';

    if (!loading && user) { // User is authenticated
      console.log('AuthContext: User is present and not loading.');
      if (role) { // User has a role
        console.log(`AuthContext: User has role: ${role}.`);
        // If on an auth page, select role page, or root, redirect to appropriate dashboard
        if (isAuthPage || isSelectRolePage || isRootPage) {
          const targetDashboard = role === 'organization' ? '/dashboard/organization' : '/dashboard/volunteer';
          console.log(`AuthContext: Current path ${pathname} is eligible for redirect. Redirecting to ${targetDashboard}...`);
          router.push(targetDashboard);
        } else {
          console.log(`AuthContext: User is on ${pathname}. No automatic redirect to dashboard needed as it's not an auth/select-role/root page.`);
        }
      } else if (!isSelectRolePage) { // User is authenticated but no role, and not already on select-role page
        console.log(`AuthContext: User has no role. Current path ${pathname}. Redirecting to /select-role.`);
        router.push('/select-role');
      } else {
        console.log(`AuthContext: User has no role, but is already on /select-role. No redirect needed.`);
      }
    } else if (!loading && !user) { // User is not authenticated
      console.log('AuthContext: User is not present and not loading.');
      const protectedRoutes = ['/dashboard', '/profile/edit', '/notifications', '/select-role', '/apply', '/chatbot', '/messages'];
      if (protectedRoutes.some(p => pathname.startsWith(p)) && !isAuthPage) {
         console.log(`AuthProvider: User not logged in. Current path ${pathname} is protected. Redirecting to /login.`);
         router.push('/login');
      } else {
        console.log(`AuthContext: User not present, not loading. Path ${pathname} is not protected or is an auth page. No redirect.`);
      }
    } else if (loading) {
      console.log('AuthContext: Still loading...');
    }
  }, [user, role, loading, router, pathname]);


  const signIn = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
    console.log('AuthContext: Attempting sign in for:', email);
    setLoading(true);
    try {
        const result = await signInUser(email, pass);
        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            console.log('AuthContext: Sign in successful. User and role set.', {id: result.user.id, role: result.user.role });
            // Redirection will be handled by the useEffect hook watching user, role, loading, pathname
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
  }, []); // Removed router from dependencies as useEffect handles redirection

  const signUp = useCallback(async (email: string, pass: string, name: string, roleToSet: UserRole): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
    console.log('AuthContext: Attempting sign up for:', email, 'with role:', roleToSet);
    if (!roleToSet) {
        return { success: false, message: 'Role is required for signup.', user: null };
    }
    setLoading(true);
    try {
        const result = await signUpUser(email, pass, name, roleToSet);
        if (result.success && result.user) {
            setUser(result.user);
            setRole(result.user.role);
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            console.log('AuthContext: Sign up successful.', {id: result.user.id, role: result.user.role });
            // Redirection will be handled by the useEffect hook
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
  }, []); // Removed router

  const signOut = useCallback(async () => {
    console.log('AuthContext: Signing out');
    setLoading(true);
    setUser(null);
    setRole(null);
    sessionStorage.removeItem('loggedInUser');
    await sleep(100); // Small delay to ensure state updates propagate if needed
    setLoading(false);
    router.push('/login'); // Explicitly redirect to login after sign out
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
            // Redirection will be handled by useEffect
            return { success: true, message: result.message };
        } else {
            return { success: false, message: result.message || 'Failed to update role.'};
        }
     } catch (error: any) {
        return { success: false, message: error.message || 'Failed to update role.'};
     } finally {
        setLoading(false);
     }
   }, [user]); // Removed router

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

  const updateUserProfile = useCallback(async (profileData: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'skills' | 'causes'>>): Promise<{ success: boolean; message: string; user?: UserProfile | null }> => {
    if (!user) return { success: false, message: 'User not logged in.' };
    // This is a placeholder. You need to create an `updateUserProfile` server action.
    // For now, let's simulate it and update local state.
    // In a real app, this server action would update 'users.json'.
    // const result = await updateUserProfileServerAction(user.id, profileData);
    console.log('AuthContext: Simulating profile update with data:', profileData);
    setLoading(true);
    await sleep(300);
    const updatedUser: UserProfile = {
        ...user,
        displayName: profileData.displayName ?? user.displayName,
        bio: profileData.bio ?? user.bio,
        skills: profileData.skills ?? user.skills,
        causes: profileData.causes ?? user.causes,
    };
    setUser(updatedUser);
    sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
    setLoading(false);
    // This is a mock success. Replace with actual server action call.
    return { success: true, message: 'Profile updated successfully (mock).', user: updatedUser };

    // Example of how it might look with a real server action:
    /*
    setLoading(true);
    try {
      const result = await updateUserProfileServerAction(user.id, profileData); // Assume this action exists
      if (result.success && result.user) {
        setUser(result.user);
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
    */
  }, [user]);


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
             return { success: false, message: result.message, newStats: null };
         }
       } catch (error: any) {
           return { success: false, message: error.message, newStats: null };
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
               return { success: false, message: result.message, newStats: null };
          }
        } catch (error: any) {
            return { success: false, message: error.message, newStats: null };
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
                return { success: false, message: result.message, newStats: null };
            }
        } catch (error: any) {
            return { success: false, message: error.message, newStats: null };
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
        return result; // Return the full result from the action
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
           return result; // Return the full result from the action
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
            // The action itself handles gamification updates. AuthContext might need to refresh
            // the volunteer's user data if they are the current user, but this is complex
            // to do generically here. Rely on volunteer re-fetching their own data.
            return result;
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


  if (loading && !user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) { // Show full page skeleton only on auth pages or root during initial load
    return (
       <div className="flex flex-col min-h-screen">
         <div className="bg-primary h-16 flex items-center justify-between px-4 shadow-md">
           <Skeleton className="h-7 w-48 bg-primary/50" />
           <Skeleton className="h-9 w-9 rounded-full bg-primary/50" />
         </div>
         <div className="flex-grow container mx-auto px-4 py-8">
           <Skeleton className="h-12 w-1/2 mb-6" />
           <Skeleton className="h-64 w-full bg-muted" />
         </div>
          <footer className="bg-primary text-primary-foreground text-center p-4">
            <Skeleton className="h-4 w-1/3 mx-auto bg-primary/50" />
          </footer>
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
        submitApplication,
        acceptApplication,
        rejectApplication,
        recordVolunteerPerformance,
        getUserConversations,
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

