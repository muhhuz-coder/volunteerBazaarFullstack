// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

// Changed roles: employee -> volunteer, company -> organization
export type UserRole = 'volunteer' | 'organization' | null;

interface UserProfile {
  id: string; // Simple ID (e.g., email or generated string)
  email: string;
  displayName: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: UserRole;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; message: string; role?: UserRole | null }>;
  signUp: (email: string, pass: string, name: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  setRoleAndUpdateUser: (role: UserRole) => Promise<void>; // Simplified role setting
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Mock user database with updated roles
const mockUsers = new Map<string, UserProfile>();
// Add a default organization and volunteer for testing
mockUsers.set('organization@example.com', { id: 'organization@example.com', email: 'organization@example.com', displayName: 'Helping Hands Org', role: 'organization' });
mockUsers.set('volunteer@example.com', { id: 'volunteer@example.com', email: 'volunteer@example.com', displayName: 'Jane Doe Volunteer', role: 'volunteer' });


export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const router = useRouter(); // Use router for redirects if needed

  // Simulate checking auth state on load
  useEffect(() => {
    setUser(null);
    setRole(null);
    setLoading(false); // No async check needed
  }, []);

  const signIn = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string; role?: UserRole | null }> => {
    console.log('Attempting mock sign in for:', email);
    setLoading(true);
    // Simulate API delay
    await new Promise(res => setTimeout(res, 500));

    const existingUser = mockUsers.get(email);

    if (existingUser) {
      // Simulate password check
      setUser(existingUser);
      setRole(existingUser.role);
      setLoading(false);
      console.log('Mock sign in successful:', existingUser);
      return { success: true, message: 'Login successful!', role: existingUser.role };
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

    const newUser: UserProfile = {
      id: email, // Use email as ID for simplicity
      email: email,
      displayName: name,
      role: roleToSet,
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
    await new Promise(res => setTimeout(res, 300)); // Simulate delay
    setUser(null);
    setRole(null);
    setLoading(false);
     // Redirect to home page after sign out
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
     await new Promise(res => setTimeout(res, 300)); // Simulate delay

     const updatedUser: UserProfile = { ...user, role: roleToSet };
     mockUsers.set(user.email, updatedUser); // Update mock DB
     setUser(updatedUser);
     setRole(roleToSet);
     setLoading(false);
     console.log(`Mock role updated to ${roleToSet} for user ${user.email}`);
   }, [user]);


  // Display a loading skeleton or similar only during explicit loading phases
  if (loading && !user) { // Show skeleton only on initial load or during sign-in/sign-up transitions when user isn't set yet
    return (
       <div className="flex flex-col min-h-screen">
         {/* Simulate Header structure */}
         <div className="bg-primary text-primary-foreground shadow-md">
           <div className="container mx-auto px-4 py-3 flex justify-between items-center">
             <Skeleton className="h-7 w-48" />
             <Skeleton className="h-9 w-20 rounded-md" />
           </div>
         </div>
         {/* Simulate Content Area */}
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
    <AuthContext.Provider value={{ user, loading, role, signIn, signUp, signOut, setRoleAndUpdateUser }}>
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
