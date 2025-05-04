// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
// Import types/interfaces from services
import type { VolunteerApplication } from '@/services/job-board';
import type { Conversation } from '@/services/messaging'; // Assuming messaging service exists
import type { VolunteerStats } from '@/services/gamification'; // Assuming gamification service exists

// Changed roles: employee -> volunteer, company -> organization
export type UserRole = 'volunteer' | 'organization' | null;

// Store mock applications and conversations here for simplicity in this mock setup
// In a real app, this would be fetched from backend services
let mockApplications: VolunteerApplication[] = [];
let mockConversations: Conversation[] = [];

// Initialize services (or ensure they are initialized elsewhere if needed)
// For this mock, we might import functions directly if services are simple modules
import {
  getConversationsForUser as fetchConversations,
  createConversation as createNewConversation,
  // Other messaging functions if needed
} from '@/services/messaging';
import {
  getUserStats as fetchUserStats,
  getLeaderboard as fetchLeaderboard,
  addPoints as addGamificationPoints,
  awardBadge as awardGamificationBadge,
  // Other gamification functions if needed
} from '@/services/gamification';
import { submitVolunteerApplication as postApplication } from '@/services/job-board';


interface UserProfile {
  id: string; // Simple ID (e.g., email or generated string)
  email: string;
  displayName: string;
  role: UserRole;
  stats?: VolunteerStats; // Add volunteer stats
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: UserRole;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; message: string; role?: UserRole | null }>;
  signUp: (email: string, pass: string, name: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  setRoleAndUpdateUser: (role: UserRole) => Promise<void>;
  // Add methods for features
  submitApplication: (application: Omit<VolunteerApplication, 'id' | 'status'>) => Promise<{ success: boolean; message: string }>;
  acceptApplication: (applicationId: string, volunteerId: string) => Promise<{ success: boolean; message: string; conversationId?: string }>;
  getUserConversations: () => Promise<Conversation[]>;
  // Gamification related methods
  addPoints: (userId: string, points: number, reason: string) => Promise<void>;
  awardBadge: (userId: string, badgeName: string, reason: string) => Promise<void>;
  // Store leaderboard data in context for easy access? Or fetch via function? Fetch for now.
  // getLeaderboardData: () => Promise<{ user: UserProfile, stats: VolunteerStats }[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Mock user database with updated roles
const mockUsers = new Map<string, UserProfile>();
// Add a default organization and volunteer for testing
mockUsers.set('organization@example.com', { id: 'org1', email: 'organization@example.com', displayName: 'Helping Hands Org', role: 'organization', stats: { points: 0, badges: [], hours: 0 } });
mockUsers.set('volunteer@example.com', { id: 'vol1', email: 'volunteer@example.com', displayName: 'Jane Doe Volunteer', role: 'volunteer', stats: { points: 0, badges: [], hours: 0 } });


export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const router = useRouter();

  // Simulate checking auth state on load
  useEffect(() => {
    // In a real app, you'd check for a token/session here
    setUser(null);
    setRole(null);
    setLoading(false); // No async check needed for mock
  }, []);

  // --- Auth Methods ---
  const signIn = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; role?: UserRole | null }> => {
    console.log('Attempting mock sign in for:', email);
    setLoading(true);
    await new Promise(res => setTimeout(res, 500));

    const existingUser = mockUsers.get(email);

    if (existingUser) {
      // Simulate fetching stats on login
      const stats = await fetchUserStats(existingUser.id);
      const userWithStats = { ...existingUser, stats };
      mockUsers.set(email, userWithStats); // Update map
      setUser(userWithStats);
      setRole(userWithStats.role);
      setLoading(false);
      console.log('Mock sign in successful:', userWithStats);
      return { success: true, message: 'Login successful!', role: userWithStats.role };
    } else {
      setLoading(false);
      console.log('Mock sign in failed: User not found');
      return { success: false, message: 'Invalid email or password.' };
    }
  }, []);

  const signUp = useCallback(async (email: string, pass: string, name: string, roleToSet: UserRole): Promise<{ success: boolean; message: string }> => {
     console.log('Attempting mock sign up for:', email, 'with role:', roleToSet);
    if (!roleToSet) {
        return { success: false, message: 'Role is required for signup.' };
    }
    setLoading(true);
    await new Promise(res => setTimeout(res, 500));

    if (mockUsers.has(email)) {
      setLoading(false);
      console.log('Mock sign up failed: Email already exists');
      return { success: false, message: 'Email already in use.' };
    }

    const userId = roleToSet === 'organization' ? `org${mockUsers.size + 1}` : `vol${mockUsers.size + 1}`;
    const newUser: UserProfile = {
      id: userId, // Generate simple unique ID
      email: email,
      displayName: name,
      role: roleToSet,
      stats: { points: 0, badges: [], hours: 0 }, // Initialize stats
    };

    mockUsers.set(email, newUser);
    setUser(newUser);
    setRole(newUser.role);
    setLoading(false);
    console.log('Mock sign up successful:', newUser);
    return { success: true, message: 'Signup successful!' };
  }, []);

  const signOut = useCallback(async () => {
    console.log('Mock signing out');
    setLoading(true);
    await new Promise(res => setTimeout(res, 300));
    setUser(null);
    setRole(null);
    setLoading(false);
     router.push('/');
     console.log('Mock sign out complete');
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
     await new Promise(res => setTimeout(res, 300));

     const updatedUser: UserProfile = { ...user, role: roleToSet };
     mockUsers.set(user.email, updatedUser);
     setUser(updatedUser);
     setRole(roleToSet);
     setLoading(false);
     console.log(`Mock role updated to ${roleToSet} for user ${user.email}`);
   }, [user]);


  // --- Feature Methods ---

  const submitApplication = useCallback(async (applicationData: Omit<VolunteerApplication, 'id' | 'status'>): Promise<{ success: boolean; message: string }> => {
    if (!user || user.role !== 'volunteer') {
      return { success: false, message: 'Only logged-in volunteers can apply.' };
    }
    setLoading(true);
    try {
      // Add applicant ID to the data
       const fullApplicationData: Omit<VolunteerApplication, 'id'> = {
         ...applicationData,
         volunteerId: user.id, // Add volunteer ID
         status: 'submitted', // Set initial status
       };
      const resultMessage = await postApplication(fullApplicationData);
       // Optionally award points for applying
       await addGamificationPoints(user.id, 5, `Applied for opportunity: ${applicationData.opportunityTitle}`);
      setLoading(false);
      return { success: true, message: resultMessage };
    } catch (error: any) {
      setLoading(false);
      return { success: false, message: error.message || 'Application submission failed.' };
    }
  }, [user]);

  const acceptApplication = useCallback(async (applicationId: string, volunteerId: string): Promise<{ success: boolean; message: string; conversationId?: string }> => {
     if (!user || user.role !== 'organization') {
       return { success: false, message: 'Only logged-in organizations can accept applications.' };
     }
     setLoading(true);
     try {
       // 1. Update application status (mock update)
       const appIndex = mockApplications.findIndex(app => app.id === applicationId);
       if (appIndex === -1) throw new Error('Application not found.');
       mockApplications[appIndex].status = 'accepted';
        const acceptedApp = mockApplications[appIndex];

       // 2. Award points to volunteer (assuming job-board service handles hours/details)
        await addGamificationPoints(volunteerId, 50, `Accepted for opportunity: ${acceptedApp.opportunityTitle}`);

        // 3. Create a new conversation between organization and volunteer
        const conversation = await createNewConversation({
           organizationId: user.id,
           volunteerId: volunteerId,
           opportunityId: acceptedApp.opportunityId,
           initialMessage: `Congratulations! Your application for "${acceptedApp.opportunityTitle}" has been accepted. Let's coordinate next steps.`,
        });


       setLoading(false);
       return { success: true, message: 'Application accepted and conversation started.', conversationId: conversation.id };
     } catch (error: any) {
       setLoading(false);
       return { success: false, message: error.message || 'Failed to accept application.' };
     }
   }, [user]);

    const getUserConversations = useCallback(async (): Promise<Conversation[]> => {
        if (!user) {
          console.error("Cannot get conversations: No user logged in.");
          return [];
        }
        setLoading(true);
        try {
          const conversations = await fetchConversations(user.id, user.role as 'organization' | 'volunteer'); // Cast role
          setLoading(false);
          return conversations;
        } catch (error: any) {
          console.error("Failed to fetch conversations:", error);
          setLoading(false);
          return [];
        }
      }, [user]);

    // --- Gamification Methods ---
    const addPoints = useCallback(async (userId: string, points: number, reason: string): Promise<void> => {
        try {
          await addGamificationPoints(userId, points, reason);
           // If the action affects the current user, update their context state
           if (user && user.id === userId) {
             const updatedStats = await fetchUserStats(userId);
             setUser(prevUser => prevUser ? { ...prevUser, stats: updatedStats } : null);
           }
        } catch (error) {
            console.error(`Failed to add points: ${error}`);
        }
    }, [user]); // Add user dependency

     const awardBadge = useCallback(async (userId: string, badgeName: string, reason: string): Promise<void> => {
         try {
           await awardGamificationBadge(userId, badgeName, reason);
            // If the action affects the current user, update their context state
            if (user && user.id === userId) {
              const updatedStats = await fetchUserStats(userId);
              setUser(prevUser => prevUser ? { ...prevUser, stats: updatedStats } : null);
            }
         } catch (error) {
             console.error(`Failed to award badge: ${error}`);
         }
     }, [user]); // Add user dependency

  // Display a loading skeleton or similar only during explicit loading phases
  if (loading && !user) {
    return (
       <div className="flex flex-col min-h-screen">
         <div className="bg-primary text-primary-foreground shadow-md">
           <div className="container mx-auto px-4 py-3 flex justify-between items-center">
             <Skeleton className="h-7 w-48" />
             <Skeleton className="h-9 w-20 rounded-md" />
           </div>
         </div>
         <div className="flex-grow container mx-auto px-4 py-8">
           <Skeleton className="h-16 w-full mb-8" />
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[...Array(3)].map((_, i) => (
               <Skeleton key={i} className="h-48 w-full" />
             ))}
           </div>
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
        addPoints,
        awardBadge,
        // getLeaderboardData, // If exposing directly
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
