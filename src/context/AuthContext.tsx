// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { setAuthCookie, clearAuthCookie } from '@/utils/setAuthCookie'; // Import cookie functions

export type UserRole = 'employee' | 'company' | null;

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  // Add other profile fields as needed, e.g., photoURL
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: UserRole;
  signOut: () => Promise<void>;
  setRoleInFirestore: (uid: string, role: UserRole) => Promise<void>;
  fetchUserRole: (uid: string) => Promise<UserRole>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);

  const fetchUserRole = async (uid: string): Promise<UserRole> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData?.role || null;
      }
       console.warn(`No user document found for UID: ${uid}`);
      return null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  const setRoleInFirestore = async (uid: string, roleToSet: UserRole): Promise<void> => {
     if (!uid || !roleToSet) return;
     try {
       const userDocRef = doc(db, 'users', uid);
       // Ensure email is also stored initially if available, useful for reference
       const userAuth = auth.currentUser;
       const dataToSet: { role: UserRole, email?: string | null } = { role: roleToSet };
       if(userAuth?.email) {
         dataToSet.email = userAuth.email;
       }
       await setDoc(userDocRef, dataToSet, { merge: true });
       setRole(roleToSet); // Update local role state
       // Update user profile state locally as well
       setUser(prevUser => prevUser ? { ...prevUser, role: roleToSet } : null);
       console.log(`Role set to ${roleToSet} for user ${uid}`);
     } catch (error) {
       console.error("Error setting user role in Firestore:", error);
     }
   };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true); // Start loading on auth state change
      if (firebaseUser) {
        console.log("Auth state changed: User logged in", firebaseUser.uid);
        const fetchedRole = await fetchUserRole(firebaseUser.uid);
        console.log("Fetched role:", fetchedRole);
        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: fetchedRole,
        };
        setUser(userProfile);
        setRole(fetchedRole);
        // Set the cookie for middleware verification
        await setAuthCookie(firebaseUser);
      } else {
        console.log("Auth state changed: User logged out");
        setUser(null);
        setRole(null);
        // Clear the cookie on logout
        clearAuthCookie();
      }
      setLoading(false); // Finish loading after processing auth state
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("Unsubscribing from auth state changes.");
      unsubscribe();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // Auth state change listener will handle setting user/role to null and clearing cookie
      console.log("Sign out initiated.");
    } catch (error) {
      console.error("Error signing out:", error);
       setLoading(false); // Ensure loading stops on error
    }
    // No finally block needed for setLoading(false), handled by listener
  };

  // Display a loading skeleton or similar while auth state is being determined initially
  // We use a separate initialLoading state to prevent brief flashes of the skeleton during sign-out/sign-in
   const [initialLoading, setInitialLoading] = useState(true);
   useEffect(() => {
     if(!loading) setInitialLoading(false);
   }, [loading]);

  if (initialLoading) {
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
    <AuthContext.Provider value={{ user, loading, role, signOut, setRoleInFirestore, fetchUserRole }}>
      {!loading ? children : null /* Render children only when not actively processing auth changes */}
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
