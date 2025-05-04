// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
// Import types/interfaces from services
import type { VolunteerApplication } from '@/services/job-board';
import type { Conversation } from '@/services/messaging';
import type { VolunteerStats } from '@/services/gamification';
// Import persistence utils
import { readData, writeData, mapToObject, objectToMap } from '@/lib/db-utils';

// Import service functions that interact with persisted data
import {
  getConversationsForUser as fetchConversations,
  createConversation as createNewConversation,
} from '@/services/messaging';
import {
  getUserStats as fetchUserStats,
  getLeaderboard as fetchLeaderboard, // Assuming leaderboard reads persisted data
  addPoints as addGamificationPoints,
  awardBadge as awardGamificationBadge,
} from '@/services/gamification';
import {
    submitVolunteerApplication as postApplication,
    updateApplicationStatus as updateAppStatus // Import for acceptApplication
} from '@/services/job-board';


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
  setRoleAndUpdateUser: (role: UserRole) => Promise<void>;
  submitApplication: (application: Omit<VolunteerApplication, 'id' | 'status' | 'submittedAt'>) => Promise<{ success: boolean; message: string }>;
  acceptApplication: (applicationId: string, volunteerId: string) => Promise<{ success: boolean; message: string; conversationId?: string }>;
  getUserConversations: () => Promise<Conversation[]>;
  addPoints: (userId: string, points: number, reason: string) => Promise<void>;
  awardBadge: (userId: string, badgeName: string, reason: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const USERS_FILE = 'users.json'; // Define the users data file

// Simulate API delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Load User Data ---
// Use state to manage the user map, loaded asynchronously
let isDataLoaded = false; // Flag to prevent multiple initial loads


export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start loading until data is checked/loaded
  const [role, setRole] = useState<UserRole>(null);
  const [usersData, setUsersData] = useState<Map<string, UserProfile>>(new Map());
  const router = useRouter();

  // Load user data on initial mount
  useEffect(() => {
    async function loadUsers() {
        if (isDataLoaded) return; // Prevent re-loading if already done
        console.log('AuthProvider: Loading initial user data...');
        try {
            const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
            const loadedUsersMap = objectToMap(usersObject);
            // Fetch initial stats for default users if they exist
            for (const [email, profile] of loadedUsersMap.entries()) {
                if (profile.role === 'volunteer' && !profile.stats) {
                    profile.stats = await fetchUserStats(profile.id); // Fetch stats if missing
                    loadedUsersMap.set(email, profile); // Update map
                }
            }
            setUsersData(loadedUsersMap);
            console.log('AuthProvider: User data loaded successfully.', loadedUsersMap);
            isDataLoaded = true; // Mark as loaded
        } catch (error) {
            console.error('AuthProvider: Failed to load user data:', error);
            // Handle error appropriately, maybe show an error state
        } finally {
            // Check for session storage persistence (simple example)
            const storedUser = sessionStorage.getItem('loggedInUser');
            if (storedUser) {
                try {
                    const parsedUser: UserProfile = JSON.parse(storedUser);
                    // Optional: Re-validate user against loaded data?
                     if (usersObject[parsedUser.email]) { // Check if user still exists in loaded data
                        setUser(parsedUser);
                        setRole(parsedUser.role);
                        console.log('AuthProvider: Restored user session from sessionStorage.', parsedUser);
                     } else {
                        sessionStorage.removeItem('loggedInUser'); // Clear invalid session
                     }
                } catch (e) {
                    console.error("AuthProvider: Error parsing stored user session.", e);
                    sessionStorage.removeItem('loggedInUser');
                }
            }
             setLoading(false); // Finish loading state
        }
    }
    loadUsers();
  }, []);

  // --- Auth Methods ---
  const signIn = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; role?: UserRole | null }> => {
    console.log('Attempting sign in for:', email);
    setLoading(true);
    await sleep(500);

    if (!isDataLoaded) {
        setLoading(false);
        return { success: false, message: 'User data not loaded yet. Please try again.' };
    }

    const existingUser = usersData.get(email);

    if (existingUser) {
      // Simulate password check (in real app, hash compare on backend)
      // For mock, just check if user exists
      let userToSet = existingUser;
      if (existingUser.role === 'volunteer') {
          const stats = await fetchUserStats(existingUser.id);
          userToSet = { ...existingUser, stats };
          // Update map in state (will trigger re-render if needed)
          setUsersData(prevMap => new Map(prevMap).set(email, userToSet));
      }

      setUser(userToSet);
      setRole(userToSet.role);
      sessionStorage.setItem('loggedInUser', JSON.stringify(userToSet)); // Persist session simply
      setLoading(false);
      console.log('Sign in successful:', userToSet);
      return { success: true, message: 'Login successful!', role: userToSet.role };
    } else {
      setLoading(false);
      console.log('Sign in failed: User not found');
      return { success: false, message: 'Invalid email or password.' };
    }
  }, [usersData]); // Depend on usersData

  const signUp = useCallback(async (email: string, pass: string, name: string, roleToSet: UserRole): Promise<{ success: boolean; message: string }> => {
     console.log('Attempting sign up for:', email, 'with role:', roleToSet);
    if (!roleToSet) {
        return { success: false, message: 'Role is required for signup.' };
    }
    if (!isDataLoaded) {
        return { success: false, message: 'User data not loaded yet. Please try again.' };
    }

    setLoading(true);
    await sleep(500);

    if (usersData.has(email)) {
      setLoading(false);
      console.log('Sign up failed: Email already exists');
      return { success: false, message: 'Email already in use.' };
    }

    const userId = roleToSet === 'organization' ? `org${usersData.size + 1}` : `vol${usersData.size + 1}`;
    const newUser: UserProfile = {
      id: userId,
      email: email,
      displayName: name,
      role: roleToSet,
      stats: roleToSet === 'volunteer' ? { points: 0, badges: [], hours: 0 } : undefined, // Initialize stats for volunteers
    };

    // Update state and save to file
    const updatedUsersMap = new Map(usersData).set(email, newUser);
    setUsersData(updatedUsersMap);
    try {
        await writeData(USERS_FILE, mapToObject(updatedUsersMap));
        // If volunteer, potentially initialize stats file if needed (gamification service might handle this)
        if (newUser.role === 'volunteer') {
             // await addGamificationPoints(newUser.id, 0, "Initial account creation"); // Or let fetchUserStats initialize
        }
        setUser(newUser);
        setRole(newUser.role);
        sessionStorage.setItem('loggedInUser', JSON.stringify(newUser)); // Persist session
        setLoading(false);
        console.log('Sign up successful and data saved:', newUser);
        return { success: true, message: 'Signup successful!' };
    } catch (error) {
         setLoading(false);
         // Revert state update if save failed?
         setUsersData(usersData);
         console.error('Sign up failed during data save:', error);
         return { success: false, message: 'Signup failed due to a server error.' };
    }
  }, [usersData]); // Depend on usersData

  const signOut = useCallback(async () => {
    console.log('Signing out');
    setLoading(true);
    await sleep(300);
    setUser(null);
    setRole(null);
    sessionStorage.removeItem('loggedInUser'); // Clear session
    setLoading(false);
     router.push('/');
     console.log('Sign out complete');
  }, [router]);

  const setRoleAndUpdateUser = useCallback(async (roleToSet: UserRole) => {
     if (!user) {
       console.error("Cannot set role: No user logged in.");
       return;
     }
      if (!roleToSet) {
         console.error("Cannot set role: Role is null or undefined.");
         return;
      }
     setLoading(true);
     await sleep(300);

     const updatedUser: UserProfile = { ...user, role: roleToSet };

     // Update state and save to file
     const updatedUsersMap = new Map(usersData).set(user.email, updatedUser);
     setUsersData(updatedUsersMap);
     try {
        await writeData(USERS_FILE, mapToObject(updatedUsersMap));
        setUser(updatedUser);
        setRole(roleToSet);
        sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser)); // Update persisted session
        setLoading(false);
        console.log(`Role updated to ${roleToSet} for user ${user.email} and data saved.`);
     } catch (error) {
        setLoading(false);
        // Revert state update if save failed?
        setUsersData(usersData);
        console.error('Failed to save role update:', error);
        throw new Error('Failed to update role.'); // Propagate error
     }
   }, [user, usersData]); // Depend on user and usersData

  // --- Feature Methods (Rely on Service Functions) ---

  const submitApplication = useCallback(async (applicationData: Omit<VolunteerApplication, 'id' | 'status' | 'submittedAt'>): Promise<{ success: boolean; message: string }> => {
    if (!user || user.role !== 'volunteer') {
      return { success: false, message: 'Only logged-in volunteers can apply.' };
    }
    setLoading(true); // Indicate processing
    try {
      // The service function now handles persistence
      const resultMessage = await postApplication({
          ...applicationData,
          volunteerId: user.id,
          status: 'submitted', // Service should handle this, but setting here for clarity
      });

      // Award points using the context method (which calls the service)
      await addPoints(user.id, 5, `Applied for opportunity: ${applicationData.opportunityTitle}`);

      setLoading(false);
      return { success: true, message: resultMessage };
    } catch (error: any) {
      setLoading(false);
      return { success: false, message: error.message || 'Application submission failed.' };
    }
  }, [user, addPoints]); // Include addPoints in dependencies

  const acceptApplication = useCallback(async (applicationId: string, volunteerId: string): Promise<{ success: boolean; message: string; conversationId?: string }> => {
     if (!user || user.role !== 'organization') {
       return { success: false, message: 'Only logged-in organizations can accept applications.' };
     }
     setLoading(true);
     try {
       // 1. Update application status via service
        const updatedApp = await updateAppStatus(applicationId, 'accepted');

       // 2. Award points to volunteer via context method
        await addPoints(volunteerId, 50, `Accepted for opportunity: ${updatedApp.opportunityTitle}`);

       // 3. Create conversation via service
        const conversation = await createNewConversation({
           organizationId: user.id,
           volunteerId: volunteerId,
           opportunityId: updatedApp.opportunityId,
           opportunityTitle: updatedApp.opportunityTitle, // Pass title
           organizationName: user.displayName, // Pass org name
           // volunteerName: updatedApp.applicantName, // Pass volunteer name if needed
           initialMessage: `Congratulations! Your application for "${updatedApp.opportunityTitle}" has been accepted. Let's coordinate next steps.`,
        });


       setLoading(false);
       return { success: true, message: 'Application accepted and conversation started.', conversationId: conversation.id };
     } catch (error: any) {
       setLoading(false);
       console.error("Error accepting application:", error);
       return { success: false, message: error.message || 'Failed to accept application.' };
     }
   }, [user, addPoints]); // Include addPoints dependency

    const getUserConversations = useCallback(async (): Promise<Conversation[]> => {
        if (!user || !user.role) { // Check role exists
          console.error("Cannot get conversations: User not logged in or role not set.");
          return [];
        }
        // setLoading(true); // Optional: Show loading specifically for conversation fetch
        try {
          // Service function reads persisted data
          const conversations = await fetchConversations(user.id, user.role);
          // setLoading(false);
          return conversations;
        } catch (error: any) {
          console.error("Failed to fetch conversations:", error);
          // setLoading(false);
          return []; // Return empty on error
        }
      }, [user]);

    // --- Gamification Methods (Call Service Functions) ---
    const addPointsProxy = useCallback(async (userId: string, points: number, reason: string): Promise<void> => {
        try {
          await addGamificationPoints(userId, points, reason); // Service handles persistence
           // If the action affects the current user, update their context state
           if (user && user.id === userId) {
             const updatedStats = await fetchUserStats(userId); // Re-fetch updated stats
             const updatedUser = { ...user, stats: updatedStats };
             setUser(updatedUser);
             sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser)); // Update session storage
             // Also update the main usersData map in state
              setUsersData(prevMap => new Map(prevMap).set(user.email, updatedUser));
           }
        } catch (error) {
            console.error(`Context: Failed to add points: ${error}`);
            // Optionally show a toast to the user
        }
    }, [user]); // Depend on user

     const awardBadgeProxy = useCallback(async (userId: string, badgeName: string, reason: string): Promise<void> => {
         try {
           await awardGamificationBadge(userId, badgeName, reason); // Service handles persistence
            // If the action affects the current user, update their context state
            if (user && user.id === userId) {
              const updatedStats = await fetchUserStats(userId); // Re-fetch updated stats
              const updatedUser = { ...user, stats: updatedStats };
              setUser(updatedUser);
              sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser)); // Update session storage
              // Also update the main usersData map in state
               setUsersData(prevMap => new Map(prevMap).set(user.email, updatedUser));
            }
         } catch (error) {
             console.error(`Context: Failed to award badge: ${error}`);
              // Optionally show a toast to the user
         }
     }, [user]); // Depend on user

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
