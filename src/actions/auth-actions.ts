// src/actions/auth-actions.ts
'use server';

import { 
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  initializeDb,
  getVolunteerStats 
} from '@/lib/db-mysql';
import type { UserProfile, UserRole } from '@/context/AuthContext';
import type { VolunteerStats } from '@/services/gamification';
import { getUserStats as fetchUserStats } from '@/services/gamification';
import type { AdminReport } from '@/services/admin'; // Import AdminReport

// Initialize the database
initializeDb();

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
    // Get the user record
    const user = await getUserByEmail(email);
    
    if (!user) {
      return { success: false, message: 'Invalid email or password.', user: null };
    }
    
    // Verify password
    let passwordMatch = false;
    let needsPasswordUpdate = false;

    // Try comparing with the hash method
    if (user.hashedPassword && compareHash(pass, user.hashedPassword)) {
      passwordMatch = true;
    } else if (user.hashedPassword === pass && !user.hashedPassword?.startsWith('hashed_')) {
      // Fallback: If stored password is plain text and matches input password
      console.log(`Server Action: User ${email} logged in with plain text password. Updating to hashed.`);
      passwordMatch = true;
      needsPasswordUpdate = true;
    }

    if (passwordMatch) {
      if (needsPasswordUpdate) {
        // Update the password to hashed format
        user.hashedPassword = simpleHash(pass);
        await updateUser(user.id, { hashedPassword: user.hashedPassword });
        console.log(`Server Action: Password for ${email} has been updated to hashed format.`);
      }

      let userToReturn = { ...user };
      delete userToReturn.hashedPassword; // Remove before sending to client

      console.log('Server Action: Sign in successful for:', email);
      return { success: true, message: 'Login successful!', user: userToReturn };
    }
    
    return { success: false, message: 'Invalid email or password.', user: null };
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
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log('Server Action: Sign up failed, email exists:', email);
      return { success: false, message: 'Email already in use.', user: null };
    }
    
    // Generate user ID based on role
    const userId = roleToSet === 'organization' ? `org_${Date.now()}` : (roleToSet === 'admin' ? `adm_${Date.now()}` : `vol_${Date.now()}`);
    
    // Hash the password before storing
    const hashedPassword = simpleHash(pass);
    
    // Create the new user object
    const newUser: UserProfile = {
      id: userId,
      email: email,
      displayName: name,
      role: roleToSet,
      hashedPassword: hashedPassword,
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
    
    // Create the user in the database
    const success = await createUser(email, newUser);
    
    if (!success) {
      return { success: false, message: 'Failed to create user account.', user: null };
    }
    
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
    // Get the user
    const userToUpdate = await getUserById(userId);
    
    if (!userToUpdate) {
      console.log('Server Action: Update role failed, user not found:', userId);
      return { success: false, message: 'User not found.', user: null };
    }
    
    // Update the role
    userToUpdate.role = newRole;
    
    // Handle volunteer stats
    if (newRole === 'volunteer' && !userToUpdate.stats) {
      try {
        userToUpdate.stats = await getVolunteerStats(userId);
      } catch (statsError) {
        console.error(`AuthAction (updateRole): Failed to fetch/init stats for new volunteer ${userId}:`, statsError);
        userToUpdate.stats = { points: 0, badges: [], hours: 0 };
      }
    } else if (newRole !== 'volunteer') {
      delete userToUpdate.stats;
    }
    
    // Set onboarding status if undefined
    if (userToUpdate.onboardingCompleted === undefined) {
      userToUpdate.onboardingCompleted = newRole === 'admin'; // Admins onboarded by default
    }
    
    // Update the user in the database
    const success = await updateUser(userId, userToUpdate);
    
    if (!success) {
      return { success: false, message: 'Failed to update user role.', user: null };
    }
    
    const { hashedPassword, ...userToReturn } = userToUpdate;
    return { success: true, message: 'Role updated successfully.', user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Role update error -", error);
    return { success: false, message: 'Server error during role update.', user: null };
  }
}

export async function getRefreshedUserAction(userId: string): Promise<{ success: boolean; user?: UserProfile | null; message?: string }> {
  console.log('Server Action: Refreshing user data for ID:', userId);
  if (!userId) {
    return { success: false, message: 'User ID is required.' };
  }
  try {
    // Get the user
    const userProfile = await getUserById(userId);
    
    if (!userProfile) {
      console.log('Server Action: Refresh failed, user not found:', userId);
      return { success: false, message: 'User not found.' };
    }
    
    // Remove sensitive data
    const { hashedPassword, ...userToReturn } = userProfile;
    
    return { success: true, user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Refresh user data error -", error);
    return { success: false, message: 'Server error during user data refresh.' };
  }
}

export async function updateUserProfilePictureAction(userId: string, imageDataUri: string): Promise<{ success: boolean; message: string; user?: UserProfile | null }> {
  console.log('Server Action: Updating profile picture for user ID:', userId);
  if (!userId) {
    return { success: false, message: 'User ID is required.', user: null };
  }
  if (!imageDataUri || !imageDataUri.startsWith('data:image')) {
    return { success: false, message: 'Invalid image data provided.', user: null };
  }
  
  try {
    // Get the user
    const userToUpdate = await getUserById(userId);
    
    if (!userToUpdate) {
      console.log('Server Action: Update profile picture failed, user not found:', userId);
      return { success: false, message: 'User not found.', user: null };
    }
    
    // Update the profile picture
    userToUpdate.profilePictureUrl = imageDataUri;
    
    // Update the user in the database
    const success = await updateUser(userId, { profilePictureUrl: imageDataUri });
    
    if (!success) {
      return { success: false, message: 'Failed to update profile picture.', user: null };
    }
    
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
  console.log('Server Action: Updating profile for user ID:', userId);
  if (!userId) {
    return { success: false, message: 'User ID is required.', user: null };
  }
  
  try {
    // Get the user
    const userToUpdate = await getUserById(userId);
    
    if (!userToUpdate) {
      console.log('Server Action: Update profile failed, user not found:', userId);
      return { success: false, message: 'User not found.', user: null };
    }
    
    // Update the profile data
    if (profileData.displayName !== undefined) userToUpdate.displayName = profileData.displayName;
    if (profileData.bio !== undefined) userToUpdate.bio = profileData.bio;
    if (profileData.skills !== undefined) userToUpdate.skills = profileData.skills;
    if (profileData.causes !== undefined) userToUpdate.causes = profileData.causes;
    if (profileData.onboardingCompleted !== undefined) userToUpdate.onboardingCompleted = profileData.onboardingCompleted;
    
    // Update the user in the database
    const success = await updateUser(userId, profileData);
    
    if (!success) {
      return { success: false, message: 'Failed to update profile.', user: null };
    }
    
    const { hashedPassword, ...userToReturn } = userToUpdate;
    return { success: true, message: 'Profile updated successfully.', user: userToReturn };
  } catch (error: any) {
    console.error("Server Action: Profile update error -", error);
    return { success: false, message: 'Server error during profile update.', user: null };
  }
}

export async function sendPasswordResetEmailAction(email: string): Promise<{ success: boolean; message: string }> {
  if (!email) {
    return { success: false, message: 'Email is required.' };
  }
  
  console.log('Server Action: Sending password reset email to:', email);
  
  try {
    // Check if email exists
    const user = await getUserByEmail(email);
    
    // Don't reveal if email exists for security
    return { 
      success: true, 
      message: 'If your email is registered, you will receive reset instructions shortly.' 
    };
  } catch (error) {
    console.error("Server Action: Password reset error -", error);
    return { success: false, message: 'Server error processing your request.' };
  }
}

export async function reportUserAction(
  reporterId: string,
  reportedUserId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: User ${reporterId} reporting user ${reportedUserId}`);
  if (!reporterId || !reportedUserId || !reason) {
    return { success: false, message: 'Missing required information for report.' };
  }
  
  try {
    // TODO: Implement report user functionality in MySQL
    // For now, return a success message
    return { success: true, message: 'User reported successfully. Our team will review it.' };
  } catch (error: any) {
    console.error("Server Action: User report error -", error);
    return { success: false, message: 'Server error during user report.' };
  }
}

