
// src/actions/auth-actions.ts
'use server';

import { readData, writeData, mapToObject, objectToMap } from '@/lib/db-utils';
import type { UserProfile, UserRole } from '@/context/AuthContext'; // Import types
import type { VolunteerStats } from '@/services/gamification'; // Import related types
import { getUserStats as fetchUserStats } from '@/services/gamification'; // Import service

const USERS_FILE = 'users.json';

/**
 * Server action to handle user sign-in.
 * Reads user data, verifies credentials (mocked), and returns user profile including latest stats if volunteer.
 */
export async function signInUser(email: string, pass: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
  console.log('Server Action: Attempting sign in for:', email);

  try {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersData = objectToMap(usersObject);
    let existingUser: UserProfile | undefined;

    // Find user by email - case-insensitive comparison might be better in real scenarios
    for (const [storedEmail, profile] of usersData.entries()) {
        if (storedEmail.toLowerCase() === email.toLowerCase()) {
            existingUser = profile;
            break;
        }
    }


    if (existingUser) {
      // Simulate password check (in a real app, hash and compare)
      // if (await bcrypt.compare(pass, existingUser.passwordHash)) { // Example with bcrypt
      // }

      let userToReturn = { ...existingUser }; // Clone to avoid mutating cached data

      // Ensure latest stats are loaded if volunteer
      if (userToReturn.role === 'volunteer') {
        try {
          console.log(`AuthAction (signIn): Fetching latest stats for volunteer ${userToReturn.id}`);
          const stats = await fetchUserStats(userToReturn.id);
          userToReturn.stats = stats;
        } catch (statsError) {
           console.error(`AuthAction (signIn): Failed to fetch stats for volunteer ${userToReturn.id}:`, statsError);
           // Assign default stats if fetch fails to ensure the structure is consistent
           userToReturn.stats = { points: 0, badges: [], hours: 0 };
        }
      }

      console.log('Server Action: Sign in successful for:', email);
      return { success: true, message: 'Login successful!', user: userToReturn };
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
 * Reads user data, checks for existing email, creates new user with initial stats if volunteer, and saves data.
 */
export async function signUpUser(email: string, pass: string, name: string, roleToSet: UserRole): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
  console.log('Server Action: Attempting sign up for:', email, 'with role:', roleToSet);

  if (!roleToSet) {
    return { success: false, message: 'Role is required for signup.', user: null };
  }

  try {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersData = objectToMap(usersObject);

     // Case-insensitive check for existing email
     let emailExists = false;
     for (const storedEmail of usersData.keys()) {
         if (storedEmail.toLowerCase() === email.toLowerCase()) {
             emailExists = true;
             break;
         }
     }

     if (emailExists) {
       console.log('Server Action: Sign up failed, email exists:', email);
       return { success: false, message: 'Email already in use.', user: null };
     }

    // Simulate password hashing
    // const passwordHash = await bcrypt.hash(pass, 10); // Example with bcrypt

    const userId = roleToSet === 'organization' ? `org_${Date.now()}` : `vol_${Date.now()}`; // More unique ID
    const newUser: UserProfile = {
      id: userId,
      email: email,
      displayName: name,
      role: roleToSet,
      stats: roleToSet === 'volunteer' ? { points: 0, badges: [], hours: 0 } : undefined,
      // passwordHash: passwordHash, // Store hash, not password
    };

    // Add new user to map (using original email casing as key) and save
    const updatedUsersMap = usersData.set(email, newUser);
    await writeData(USERS_FILE, mapToObject(updatedUsersMap));

    // Note: Gamification service initializes stats file if needed when first accessed by getUserStats

    console.log('Server Action: Sign up successful:', newUser);
    // Return the user object without the password hash
    const { ...userToReturn } = newUser;
    return { success: true, message: 'Signup successful!', user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Sign up error -", error);
    return { success: false, message: 'Server error during sign up.', user: null };
  }
}

/**
 * Server action to update a user's role.
 * Reads user data, updates the role, handles stats initialization/removal, and saves data.
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
    if (newRole === 'volunteer') {
        if (!userToUpdate.stats) {
             // Fetch potentially existing stats or initialize defaults
             try {
                userToUpdate.stats = await fetchUserStats(userId);
             } catch (statsError) {
                 console.error(`AuthAction (updateRole): Failed to fetch/init stats for new volunteer ${userId}:`, statsError);
                 userToUpdate.stats = { points: 0, badges: [], hours: 0 }; // Default on error
             }
        }
    } else if (newRole !== 'volunteer') {
        delete userToUpdate.stats; // Remove stats if not a volunteer
    }


    // Update map and save
    const updatedUsersMap = usersData.set(userEmail, userToUpdate);
    await writeData(USERS_FILE, mapToObject(updatedUsersMap));

    console.log('Server Action: Role update successful for:', userId);
     // Return the user object without potentially sensitive info like password hash
    const { ...userToReturn } = userToUpdate;
    return { success: true, message: 'Role updated successfully.', user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Role update error -", error);
    return { success: false, message: 'Server error during role update.', user: null };
  }
}

/**
 * Server action to get the latest user profile data, including refreshed stats for volunteers.
 * Useful for ensuring context has up-to-date info after session restoration.
 */
export async function getRefreshedUserAction(userId: string): Promise<{ success: boolean; user?: UserProfile | null; message?: string }> {
    console.log('Server Action: Refreshing user data for ID:', userId);
    try {
        const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
        const usersData = objectToMap(usersObject);

        let userProfile: UserProfile | undefined;
        let userEmail: string | undefined;

        // Find user by ID
        for (const [email, profile] of usersData.entries()) {
            if (profile.id === userId) {
                userProfile = profile;
                userEmail = email; // Store email in case we need it (though not strictly needed here)
                break;
            }
        }

        if (!userProfile) {
            console.log('Server Action: Refresh failed, user not found:', userId);
            return { success: false, message: 'User not found.' };
        }

        let userToReturn = { ...userProfile }; // Clone

        // If volunteer, fetch latest stats
        if (userToReturn.role === 'volunteer') {
            try {
                console.log(`AuthAction (refresh): Fetching latest stats for volunteer ${userToReturn.id}`);
                const stats = await fetchUserStats(userToReturn.id);
                userToReturn.stats = stats;
            } catch (statsError) {
                console.error(`AuthAction (refresh): Failed to fetch stats for volunteer ${userToReturn.id}:`, statsError);
                // Keep existing stats or assign default if stats fetch fails? Decide based on desired behavior.
                // For now, let's assign default to ensure consistency if fetch fails.
                userToReturn.stats = userToReturn.stats || { points: 0, badges: [], hours: 0 };
            }
        }

        console.log('Server Action: User refresh successful for:', userId);
        // Return the user object without potentially sensitive info like password hash
        const { ...finalUser } = userToReturn;
        return { success: true, user: finalUser };

    } catch (error: any) {
        console.error("Server Action: User refresh error -", error);
        return { success: false, message: 'Server error during user refresh.' };
    }
}
