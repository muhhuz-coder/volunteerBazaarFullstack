
// src/actions/auth-actions.ts
'use server';

import { readData, writeData, mapToObject, objectToMap } from '@/lib/db-utils';
import type { UserProfile, UserRole } from '@/context/AuthContext';
import type { VolunteerStats } from '@/services/gamification';
import { getUserStats as fetchUserStats } from '@/services/gamification';
import type { AdminReport } from '@/services/admin'; // Import AdminReport

const USERS_FILE = 'users.json';
const REPORTS_FILE = 'reports.json'; // For storing user reports

// VERY BASIC HASHING - REPLACE WITH SECURE LIBRARY (e.g., bcrypt) IN PRODUCTION
const simpleHash = (password: string): string => {
  // This is NOT secure. It's a placeholder for demonstration.
  // In a real app, use a library like bcrypt.
  // Example: const salt = await bcrypt.genSalt(10); return await bcrypt.hash(password, salt);
  return `hashed_${password}_placeholder`;
};

const compareHash = (password: string, hashedPassword?: string): boolean => {
  if (!hashedPassword) return false;
  // This is NOT secure.
  // In a real app with bcrypt: return await bcrypt.compare(password, hashedPassword);
  return `hashed_${password}_placeholder` === hashedPassword;
};


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

    if (existingUser && userEmailKey && compareHash(pass, existingUser.hashedPassword)) {
      let userToReturn = { ...existingUser };
       // IMPORTANT: Remove hashedPassword before sending to client
       delete userToReturn.hashedPassword;

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
    const userId = roleToSet === 'organization' ? `org_${Date.now()}` : (roleToSet === 'admin' ? `adm_${Date.now()}` : `vol_${Date.now()}`);
    
    // Hash the password before storing
    const hashedPassword = simpleHash(pass); // REPLACE with secure hashing

    const newUser: UserProfile = {
      id: userId,
      email: email,
      displayName: name,
      role: roleToSet,
      hashedPassword: hashedPassword, // Store the hashed password
      stats: roleToSet === 'volunteer' ? { points: 0, badges: [], hours: 0 } : undefined,
      profilePictureUrl: undefined,
      bio: '', 
      skills: [], 
      causes: [], 
      onboardingCompleted: roleToSet === 'admin', // Admins are considered onboarded by default
    };

    // Special case for admin user
    if (email === 'admin@gmail.com' && pass === 'admin123') {
        newUser.role = 'admin';
        newUser.onboardingCompleted = true;
    }


    const updatedUsersMap = usersData.set(email, newUser);
    await writeData(USERS_FILE, mapToObject(updatedUsersMap));
    console.log('Server Action: Sign up successful:', newUser);
    
    // IMPORTANT: Remove hashedPassword before sending to client
    const { hashedPassword: _, ...userToReturn } = newUser; 
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
    
    if (userToUpdate.onboardingCompleted === undefined) {
        userToUpdate.onboardingCompleted = newRole === 'admin'; // Admins onboarded by default
    }

    const updatedUsersMap = usersData.set(userEmail, userToUpdate);
    await writeData(USERS_FILE, mapToObject(updatedUsersMap));
    console.log('Server Action: Role update successful for:', userId);
    const { hashedPassword, ...userToReturn } = userToUpdate;
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
        const { hashedPassword, ...finalUser } = userToReturn;
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
    const { hashedPassword, ...userToReturn } = userToUpdate;
    return { success: true, message: 'Profile picture updated successfully.', user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Profile picture update error -", error);
    return { success: false, message: 'Server error during profile picture update.', user: null };
  }
}

export async function updateUserProfileBioSkillsCausesAction(
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
    const { hashedPassword, ...userToReturn } = userToUpdate;
    return { success: true, message: 'Profile updated successfully.', user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Profile update error -", error);
    return { success: false, message: 'Server error during profile update.', user: null };
  }
}

export async function sendPasswordResetEmailAction(email: string): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: Password reset requested for email: ${email}`);
  // In a real app, this would generate a secure token, store it with an expiry, and send an email.
  // For this mock, we'll just check if the user exists.
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
    // Still return a generic message to avoid confirming if an email is registered
    return { success: false, message: "If this email is registered, a reset link will be sent (mock)." };
  }

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 500)); 
  return { success: true, message: "If your email is registered, a password reset link has been sent (mock)." };
}


export async function reportUserAction(
  reporterId: string,
  reportedUserId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: User ${reporterId} reporting user ${reportedUserId} for: ${reason}`);
  if (!reporterId || !reportedUserId || !reason) {
    return { success: false, message: "Missing required information for reporting." };
  }
  try {
    const reports = await readData<AdminReport[]>(REPORTS_FILE, []);
    const newReport: AdminReport = {
      id: `report_${Date.now()}`,
      reporterId,
      reportedUserId,
      reason,
      timestamp: new Date(),
      status: 'pending',
    };
    reports.push(newReport);
    await writeData(REPORTS_FILE, reports);
    return { success: true, message: "User reported successfully. Our team will review it." };
  } catch (error: any) {
    console.error("Server Action: Report user error -", error);
    return { success: false, message: error.message || 'Failed to submit report.' };
  }
}
