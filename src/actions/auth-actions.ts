
// src/actions/auth-actions.ts
'use server';

import { readData, writeData, mapToObject, objectToMap } from '@/lib/db-utils';
import type { UserProfile, UserRole } from '@/context/AuthContext'; // Import types
import type { VolunteerStats } from '@/services/gamification'; // Import related types
import { getUserStats as fetchUserStats } from '@/services/gamification'; // Import service

const USERS_FILE = 'users.json';

/**
 * Server action to handle user sign-in.
 * Reads user data, verifies credentials (mocked), and returns user profile.
 */
export async function signInUser(email: string, pass: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
  console.log('Server Action: Attempting sign in for:', email);

  try {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersData = objectToMap(usersObject);
    const existingUser = usersData.get(email);

    if (existingUser) {
      // Simulate password check
      let userToSet = existingUser;
      // Ensure stats are loaded if volunteer
      if (userToSet.role === 'volunteer' && !userToSet.stats) {
        try {
          const stats = await fetchUserStats(userToSet.id);
          userToSet = { ...userToSet, stats };
          // Update map for consistency, but no need to save just for stats fetch during login
        } catch (statsError) {
           console.error(`AuthAction (signIn): Failed to fetch stats for volunteer ${userToSet.id}:`, statsError);
           // Assign default stats if fetch fails
           userToSet = { ...userToSet, stats: { points: 0, badges: [], hours: 0 } };
        }
      }
      console.log('Server Action: Sign in successful for:', email);
      return { success: true, message: 'Login successful!', user: userToSet };
    } else {
      console.log('Server Action: Sign in failed, user not found:', email);
      return { success: false, message: 'Invalid email or password.', user: null };
    }
  } catch (error: any) {
    console.error("Server Action: Sign in error -", error);
    return { success: false, message: 'Server error during sign in.', user: null };
  }
}

/**
 * Server action to handle user sign-up.
 * Reads user data, checks for existing email, creates new user, and saves data.
 */
export async function signUpUser(email: string, pass: string, name: string, roleToSet: UserRole): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
  console.log('Server Action: Attempting sign up for:', email, 'with role:', roleToSet);

  if (!roleToSet) {
    return { success: false, message: 'Role is required for signup.', user: null };
  }

  try {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersData = objectToMap(usersObject);

    if (usersData.has(email)) {
      console.log('Server Action: Sign up failed, email exists:', email);
      return { success: false, message: 'Email already in use.', user: null };
    }

    const userId = roleToSet === 'organization' ? `org${usersData.size + 1}` : `vol${usersData.size + 1}`;
    const newUser: UserProfile = {
      id: userId,
      email: email,
      displayName: name,
      role: roleToSet,
      stats: roleToSet === 'volunteer' ? { points: 0, badges: [], hours: 0 } : undefined,
    };

    // Add new user to map and save
    const updatedUsersMap = usersData.set(email, newUser);
    await writeData(USERS_FILE, mapToObject(updatedUsersMap));

    // Initialize stats file for volunteer if gamification service doesn't handle it automatically
    if (newUser.role === 'volunteer') {
       // Could call a function here like initializeStats(newUser.id) if needed
    }

    console.log('Server Action: Sign up successful:', newUser);
    return { success: true, message: 'Signup successful!', user: newUser };
  } catch (error: any) {
    console.error("Server Action: Sign up error -", error);
    return { success: false, message: 'Server error during sign up.', user: null };
  }
}

/**
 * Server action to update a user's role.
 * Reads user data, updates the role, and saves data.
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
  console.log('Server Action: Updating role for user ID:', userId, 'to:', newRole);

  if (!newRole) {
      return { success: false, message: 'A valid role must be provided.', user: null };
  }

  try {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersData = objectToMap(usersObject);

    let userEmail: string | undefined;
    let userToUpdate: UserProfile | undefined;

    // Find user by ID
    for (const [email, profile] of usersData.entries()) {
        if (profile.id === userId) {
            userEmail = email;
            userToUpdate = profile;
            break;
        }
    }

    if (!userToUpdate || !userEmail) {
        console.log('Server Action: Update role failed, user not found:', userId);
        return { success: false, message: 'User not found.', user: null };
    }

    // Update the role
    userToUpdate.role = newRole;
    // Ensure stats are handled correctly if switching to/from volunteer
    if (newRole === 'volunteer' && !userToUpdate.stats) {
        userToUpdate.stats = { points: 0, badges: [], hours: 0 };
    } else if (newRole !== 'volunteer') {
        delete userToUpdate.stats; // Remove stats if not a volunteer
    }


    // Update map and save
    const updatedUsersMap = usersData.set(userEmail, userToUpdate);
    await writeData(USERS_FILE, mapToObject(updatedUsersMap));

    console.log('Server Action: Role update successful for:', userId);
    return { success: true, message: 'Role updated successfully.', user: userToUpdate };
  } catch (error: any) {
    console.error("Server Action: Role update error -", error);
    return { success: false, message: 'Server error during role update.', user: null };
  }
}
