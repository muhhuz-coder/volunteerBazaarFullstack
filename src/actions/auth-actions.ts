
// src/actions/auth-actions.ts
'use server';

import { readData, writeData, mapToObject, objectToMap } from '@/lib/db-utils';
import type { UserProfile, UserRole } from '@/context/AuthContext';
import type { VolunteerStats } from '@/services/gamification';
import { getUserStats as fetchUserStats } from '@/services/gamification';

const USERS_FILE = 'users.json';

export async function signInUser(email: string, pass: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
  console.log('Server Action: Attempting sign in for:', email);
  try {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersData = objectToMap(usersObject);
    let existingUser: UserProfile | undefined;
    let userEmailKey: string | undefined;

    for (const [storedEmail, profile] of usersData.entries()) {
        if (storedEmail.toLowerCase() === email.toLowerCase()) {
            existingUser = profile;
            userEmailKey = storedEmail;
            break;
        }
    }

    if (existingUser && userEmailKey) {
      if (existingUser.isSuspended) {
        console.log('Server Action: Sign in failed, user account is suspended:', email);
        return { success: false, message: 'Your account has been suspended. Please contact support.', user: null };
      }

      let userToReturn = { ...existingUser };
      if (userToReturn.role === 'volunteer') {
        try {
          console.log(`AuthAction (signIn): Fetching latest stats for volunteer ${userToReturn.id}`);
          const stats = await fetchUserStats(userToReturn.id);
          userToReturn.stats = stats;
        } catch (statsError) {
           console.error(`AuthAction (signIn): Failed to fetch stats for volunteer ${userToReturn.id}:`, statsError);
           userToReturn.stats = { points: 0, badges: [], hours: 0 };
        }
      }
      console.log('Server Action: Sign in successful for:', email);
      return { success: true, message: 'Login successful!', user: userToReturn };
    } else {
      console.log('Server Action: Sign in failed, user not found or password incorrect:', email);
      return { success: false, message: 'Invalid email or password.', user: null };
    }
  } catch (error: any) {
    console.error("Server Action: Sign in error -", error);
    return { success: false, message: 'Server error during sign in.', user: null };
  }
}

export async function signUpUser(email: string, pass: string, name: string, roleToSet: UserRole): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
  console.log('Server Action: Attempting sign up for:', email, 'with role:', roleToSet);
  if (!roleToSet) {
    return { success: false, message: 'Role is required for signup.', user: null };
  }
  try {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersData = objectToMap(usersObject);
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
    const userId = roleToSet === 'organization' ? `org_${Date.now()}` : `vol_${Date.now()}`;
    const newUser: UserProfile = {
      id: userId,
      email: email,
      displayName: name,
      role: roleToSet,
      stats: roleToSet === 'volunteer' ? { points: 0, badges: [], hours: 0 } : undefined,
      profilePictureUrl: undefined,
      bio: '', 
      skills: [], 
      causes: [], 
      onboardingCompleted: false,
      blockedUserIds: [], // Initialize blockedUserIds
      isSuspended: false,   // Initialize isSuspended
    };
    const updatedUsersMap = usersData.set(email, newUser);
    await writeData(USERS_FILE, mapToObject(updatedUsersMap));
    console.log('Server Action: Sign up successful:', newUser);
    const { ...userToReturn } = newUser;
    return { success: true, message: 'Signup successful!', user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Sign up error -", error);
    return { success: false, message: 'Server error during sign up.', user: null };
  }
}

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
    userToUpdate.role = newRole;
    if (newRole === 'volunteer') {
        if (!userToUpdate.stats) {
             try {
                userToUpdate.stats = await fetchUserStats(userId);
             } catch (statsError) {
                 console.error(`AuthAction (updateRole): Failed to fetch/init stats for new volunteer ${userId}:`, statsError);
                 userToUpdate.stats = { points: 0, badges: [], hours: 0 };
             }
        }
    } else if (newRole !== 'volunteer') {
        delete userToUpdate.stats;
    }
    
    userToUpdate.onboardingCompleted = userToUpdate.onboardingCompleted ?? false;
    userToUpdate.blockedUserIds = userToUpdate.blockedUserIds ?? [];
    userToUpdate.isSuspended = userToUpdate.isSuspended ?? false;

    const updatedUsersMap = usersData.set(userEmail, userToUpdate);
    await writeData(USERS_FILE, mapToObject(updatedUsersMap));
    console.log('Server Action: Role update successful for:', userId);
    const { ...userToReturn } = userToUpdate;
    return { success: true, message: 'Role updated successfully.', user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Role update error -", error);
    return { success: false, message: 'Server error during role update.', user: null };
  }
}

export async function getRefreshedUserAction(userId: string): Promise<{ success: boolean; user?: UserProfile | null; message?: string }> {
    console.log('Server Action: Refreshing user data for ID:', userId);
    try {
        const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
        const usersData = objectToMap(usersObject);
        let userProfile: UserProfile | undefined;
        let userEmail: string | undefined;
        for (const [email, profile] of usersData.entries()) {
            if (profile.id === userId) {
                userProfile = profile;
                userEmail = email;
                break;
            }
        }
        if (!userProfile || !userEmail) {
            console.log('Server Action: Refresh failed, user not found:', userId);
            return { success: false, message: 'User not found.' };
        }
        
        // If user is suspended, prevent further processing / return suspended state
        if (userProfile.isSuspended) {
             console.log('Server Action: User is suspended. Refresh aborted for active session logic.', userId);
             // Return the user object but indicate potential issue or let AuthContext handle it
             return { success: true, user: { ...userProfile } }; // Or return success:false, message: "Account suspended"
        }

        let userToReturn = { ...userProfile };
        if (userToReturn.role === 'volunteer') {
            try {
                console.log(`AuthAction (refresh): Fetching latest stats for volunteer ${userToReturn.id}`);
                const stats = await fetchUserStats(userToReturn.id);
                userToReturn.stats = stats;
            } catch (statsError) {
                console.error(`AuthAction (refresh): Failed to fetch stats for volunteer ${userToReturn.id}:`, statsError);
                userToReturn.stats = userToReturn.stats || { points: 0, badges: [], hours: 0 };
            }
        }
        console.log('Server Action: User refresh successful for:', userId);
        const { ...finalUser } = userToReturn; // Ensure all properties are spread
        return { success: true, user: finalUser };
    } catch (error: any) {
        console.error("Server Action: User refresh error -", error);
        return { success: false, message: 'Server error during user refresh.' };
    }
}

export async function updateUserProfilePictureAction(userId: string, imageDataUri: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
  console.log(`Server Action: Updating profile picture for user ID: ${userId}`);
  if (!imageDataUri || !imageDataUri.startsWith('data:image')) {
    return { success: false, message: 'Invalid image data provided.', user: null };
  }
  try {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersData = objectToMap(usersObject);
    let userEmail: string | undefined;
    let userToUpdate: UserProfile | undefined;
    for (const [email, profile] of usersData.entries()) {
      if (profile.id === userId) {
        userEmail = email;
        userToUpdate = profile;
        break;
      }
    }
    if (!userToUpdate || !userEmail) {
      console.log('Server Action: Update profile picture failed, user not found:', userId);
      return { success: false, message: 'User not found.', user: null };
    }
    userToUpdate.profilePictureUrl = imageDataUri;
    const updatedUsersMap = usersData.set(userEmail, userToUpdate);
    await writeData(USERS_FILE, mapToObject(updatedUsersMap));
    console.log('Server Action: Profile picture update successful for:', userId);
    const { ...userToReturn } = userToUpdate;
    return { success: true, message: 'Profile picture updated successfully.', user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Profile picture update error -", error);
    return { success: false, message: 'Server error during profile picture update.', user: null };
  }
}

export async function updateUserProfileBioSkillsCauses(
  userId: string,
  profileData: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'skills' | 'causes' | 'onboardingCompleted'>>
): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
  console.log(`Server Action: Updating profile for user ID: ${userId}`, profileData);
  try {
    const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
    const usersData = objectToMap(usersObject);
    let userEmailKey: string | undefined;
    let userToUpdate: UserProfile | undefined;
    for (const [emailKey, profile] of usersData.entries()) {
      if (profile.id === userId) {
        userEmailKey = emailKey;
        userToUpdate = profile;
        break;
      }
    }
    if (!userToUpdate || !userEmailKey) {
      console.log('Server Action: Update profile failed, user not found:', userId);
      return { success: false, message: 'User not found.', user: null };
    }
    if (profileData.displayName !== undefined) userToUpdate.displayName = profileData.displayName;
    if (profileData.bio !== undefined) userToUpdate.bio = profileData.bio;
    if (profileData.skills !== undefined) userToUpdate.skills = profileData.skills;
    if (profileData.causes !== undefined) userToUpdate.causes = profileData.causes;
    if (profileData.onboardingCompleted !== undefined) userToUpdate.onboardingCompleted = profileData.onboardingCompleted;

    const updatedUsersMap = usersData.set(userEmailKey, userToUpdate);
    await writeData(USERS_FILE, mapToObject(updatedUsersMap));
    console.log('Server Action: Profile update successful for:', userId);
    const { ...userToReturn } = userToUpdate;
    return { success: true, message: 'Profile updated successfully.', user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Profile update error -", error);
    return { success: false, message: 'Server error during profile update.', user: null };
  }
}

export async function sendPasswordResetEmailAction(email: string): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: Password reset requested for email: ${email}`);
  const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
  const usersData = objectToMap(usersObject);
  let emailExists = false;
  for (const storedEmail of usersData.keys()) {
    if (storedEmail.toLowerCase() === email.toLowerCase()) {
      emailExists = true;
      break;
    }
  }
  if (!emailExists) {
    return { success: false, message: "If this email is registered, a reset link will be sent (mock)." };
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: "If your email is registered, a password reset link has been sent (mock)." };
}

// New action to set user as suspended (intended for admin use, not exposed to client directly in this iteration)
export async function suspendUserAccount(userIdToSuspend: string, adminUserId: string): Promise<{ success: boolean; message: string }> {
    // In a real app, verify adminUserId has rights
    console.log(`Admin Action: Attempting to suspend user ${userIdToSuspend} by admin ${adminUserId}`);
    try {
        const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
        const usersData = objectToMap(usersObject);
        let userEmailKey: string | undefined;
        let userToSuspend: UserProfile | undefined;

        for (const [email, profile] of usersData.entries()) {
            if (profile.id === userIdToSuspend) {
                userEmailKey = email;
                userToSuspend = profile;
                break;
            }
        }

        if (!userToSuspend || !userEmailKey) {
            return { success: false, message: 'User to suspend not found.' };
        }

        userToSuspend.isSuspended = true;
        usersData.set(userEmailKey, userToSuspend);
        await writeData(USERS_FILE, mapToObject(usersData));
        console.log(`Admin Action: User ${userIdToSuspend} has been suspended.`);
        return { success: true, message: 'User account suspended successfully.' };
    } catch (error: any) {
        console.error(`Admin Action: Error suspending user ${userIdToSuspend}:`, error);
        return { success: false, message: 'Server error during account suspension.' };
    }
}

// New action to unsuspend a user account
export async function unsuspendUserAccount(userIdToUnsuspend: string, adminUserId: string): Promise<{ success: boolean; message: string }> {
    console.log(`Admin Action: Attempting to unsuspend user ${userIdToUnsuspend} by admin ${adminUserId}`);
    try {
        const usersObject = await readData<Record<string, UserProfile>>(USERS_FILE, {});
        const usersData = objectToMap(usersObject);
        let userEmailKey: string | undefined;
        let userToUnsuspend: UserProfile | undefined;

        for (const [email, profile] of usersData.entries()) {
            if (profile.id === userIdToUnsuspend) {
                userEmailKey = email;
                userToUnsuspend = profile;
                break;
            }
        }

        if (!userToUnsuspend || !userEmailKey) {
            return { success: false, message: 'User to unsuspend not found.' };
        }

        userToUnsuspend.isSuspended = false;
        usersData.set(userEmailKey, userToUnsuspend);
        await writeData(USERS_FILE, mapToObject(usersData));
        console.log(`Admin Action: User ${userIdToUnsuspend} has been unsuspended.`);
        return { success: true, message: 'User account unsuspended successfully.' };
    } catch (error: any) {
        console.error(`Admin Action: Error unsuspending user ${userIdToUnsuspend}:`, error);
        return { success: false, message: 'Server error during account unsuspension.' };
    }
}
