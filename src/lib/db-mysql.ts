import mysql from 'mysql2/promise';
import type { VolunteerStats } from '@/services/gamification';
import type { UserProfile, UserRole } from '@/context/AuthContext';
import type { Opportunity, VolunteerApplication } from '@/services/job-board';
import type { Conversation, Message } from '@/services/messaging';
import type { AdminReport } from '@/services/admin';
import type { UserNotification } from '@/services/notification';

// MySQL connection pool
let pool: mysql.Pool;

// Initialize the MySQL connection pool
export function initializeDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'volunteer_bazaar',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('MySQL connection pool initialized');
  }
  return pool;
}

// Get a connection from the pool
export async function getConnection(): Promise<mysql.PoolConnection> {
  if (!pool) {
    initializeDb();
  }
  return await pool.getConnection();
}

// Execute a query with parameters
export async function executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('MySQL query execution error:', error);
    throw error;
  }
}

// User-related functions

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const sql = `
    SELECT u.*, 
           GROUP_CONCAT(DISTINCT us.skill) as skills,
           GROUP_CONCAT(DISTINCT uc.cause) as causes,
           vs.points, vs.hours
    FROM users u
    LEFT JOIN user_skills us ON u.id = us.user_id
    LEFT JOIN user_causes uc ON u.id = uc.user_id
    LEFT JOIN volunteer_stats vs ON u.id = vs.user_id
    WHERE u.email = ?
    GROUP BY u.id
  `;
  
  const users = await executeQuery<any>(sql, [email]);
  
  if (users.length === 0) {
    return null;
  }
  
  const user = users[0];
  
  // Transform the user object to match the expected structure
  const userProfile: UserProfile = {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role as UserRole,
    hashedPassword: user.hashed_password,
    profilePictureUrl: user.profile_picture_url,
    bio: user.bio,
    onboardingCompleted: user.onboarding_completed === 1,
    skills: user.skills ? user.skills.split(',') : [],
    causes: user.causes ? user.causes.split(',') : []
  };
  
  // Add stats for volunteers
  if (user.role === 'volunteer') {
    userProfile.stats = await getVolunteerStats(user.id);
  }
  
  return userProfile;
}

/**
 * Get a user by ID
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  const sql = `
    SELECT u.*, 
           GROUP_CONCAT(DISTINCT us.skill) as skills,
           GROUP_CONCAT(DISTINCT uc.cause) as causes,
           vs.points, vs.hours
    FROM users u
    LEFT JOIN user_skills us ON u.id = us.user_id
    LEFT JOIN user_causes uc ON u.id = uc.user_id
    LEFT JOIN volunteer_stats vs ON u.id = vs.user_id
    WHERE u.id = ?
    GROUP BY u.id
  `;
  
  const users = await executeQuery<any>(sql, [userId]);
  
  if (users.length === 0) {
    return null;
  }
  
  const user = users[0];
  
  // Transform the user object to match the expected structure
  const userProfile: UserProfile = {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role as UserRole,
    hashedPassword: user.hashed_password,
    profilePictureUrl: user.profile_picture_url,
    bio: user.bio,
    onboardingCompleted: user.onboarding_completed === 1,
    skills: user.skills ? user.skills.split(',') : [],
    causes: user.causes ? user.causes.split(',') : []
  };
  
  // Add stats for volunteers
  if (user.role === 'volunteer') {
    userProfile.stats = await getVolunteerStats(user.id);
  }
  
  return userProfile;
}

/**
 * Create a new user
 */
export async function createUser(email: string, userProfile: UserProfile): Promise<boolean> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Insert user record
    const userSql = `
      INSERT INTO users (id, email, display_name, role, hashed_password, profile_picture_url, bio, onboarding_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await connection.execute(userSql, [
      userProfile.id,
      email,
      userProfile.displayName,
      userProfile.role,
      userProfile.hashedPassword || '',
      userProfile.profilePictureUrl || null,
      userProfile.bio || null,
      userProfile.onboardingCompleted || false
    ]);
    
    // Insert skills if any
    if (userProfile.skills && userProfile.skills.length > 0) {
      for (const skill of userProfile.skills) {
        const skillSql = `INSERT INTO user_skills (user_id, skill) VALUES (?, ?)`;
        await connection.execute(skillSql, [userProfile.id, skill]);
      }
    }
    
    // Insert causes if any
    if (userProfile.causes && userProfile.causes.length > 0) {
      for (const cause of userProfile.causes) {
        const causeSql = `INSERT INTO user_causes (user_id, cause) VALUES (?, ?)`;
        await connection.execute(causeSql, [userProfile.id, cause]);
      }
    }
    
    // Initialize volunteer stats if user is a volunteer
    if (userProfile.role === 'volunteer') {
      const statsSql = `
        INSERT INTO volunteer_stats (user_id, points, hours)
        VALUES (?, ?, ?)
      `;
      const points = userProfile.stats?.points || 0;
      const hours = userProfile.stats?.hours || 0;
      await connection.execute(statsSql, [userProfile.id, points, hours]);
      
      // Insert badges if any
      if (userProfile.stats?.badges && userProfile.stats.badges.length > 0) {
        for (const badge of userProfile.stats.badges) {
          const badgeSql = `INSERT INTO volunteer_badges (user_id, badge) VALUES (?, ?)`;
          await connection.execute(badgeSql, [userProfile.id, badge]);
        }
      }
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error creating user:', error);
    return false;
  } finally {
    connection.release();
  }
}

/**
 * Update a user profile
 */
export async function updateUser(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Update the main user record
    if (updates.displayName || updates.profilePictureUrl || updates.bio || updates.onboardingCompleted !== undefined) {
      const updateFields = [];
      const params = [];
      
      if (updates.displayName) {
        updateFields.push('display_name = ?');
        params.push(updates.displayName);
      }
      
      if (updates.profilePictureUrl !== undefined) {
        updateFields.push('profile_picture_url = ?');
        params.push(updates.profilePictureUrl);
      }
      
      if (updates.bio !== undefined) {
        updateFields.push('bio = ?');
        params.push(updates.bio);
      }
      
      if (updates.onboardingCompleted !== undefined) {
        updateFields.push('onboarding_completed = ?');
        params.push(updates.onboardingCompleted);
      }
      
      if (updates.hashedPassword) {
        updateFields.push('hashed_password = ?');
        params.push(updates.hashedPassword);
      }
      
      if (updates.role) {
        updateFields.push('role = ?');
        params.push(updates.role);
      }
      
      if (updateFields.length > 0) {
        params.push(userId);
        const updateSql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        await connection.execute(updateSql, params);
      }
    }
    
    // Update skills
    if (updates.skills) {
      // Remove existing skills
      await connection.execute('DELETE FROM user_skills WHERE user_id = ?', [userId]);
      
      // Add new skills
      if (updates.skills.length > 0) {
        for (const skill of updates.skills) {
          await connection.execute('INSERT INTO user_skills (user_id, skill) VALUES (?, ?)', [userId, skill]);
        }
      }
    }
    
    // Update causes
    if (updates.causes) {
      // Remove existing causes
      await connection.execute('DELETE FROM user_causes WHERE user_id = ?', [userId]);
      
      // Add new causes
      if (updates.causes.length > 0) {
        for (const cause of updates.causes) {
          await connection.execute('INSERT INTO user_causes (user_id, cause) VALUES (?, ?)', [userId, cause]);
        }
      }
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error updating user:', error);
    return false;
  } finally {
    connection.release();
  }
}

// Volunteer stats functions

/**
 * Get volunteer stats
 */
export async function getVolunteerStats(userId: string): Promise<VolunteerStats> {
  // Get basic stats
  const statsSql = `SELECT points, hours FROM volunteer_stats WHERE user_id = ?`;
  const stats = await executeQuery<any>(statsSql, [userId]);
  
  // Get badges
  const badgesSql = `SELECT badge FROM volunteer_badges WHERE user_id = ?`;
  const badgesResult = await executeQuery<{badge: string}>(badgesSql, [userId]);
  const badges = badgesResult.map(r => r.badge);
  
  if (stats.length > 0) {
    return {
      points: stats[0].points,
      hours: stats[0].hours,
      badges: badges
    };
  } else {
    // Default stats if none exist
    return {
      points: 0,
      hours: 0,
      badges: []
    };
  }
}

/**
 * Add points to a volunteer
 */
export async function addPoints(userId: string, points: number, reason: string): Promise<VolunteerStats> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if stats record exists
    const checkSql = `SELECT COUNT(*) as count FROM volunteer_stats WHERE user_id = ?`;
    const [result] = await connection.execute<any>(checkSql, [userId]);
    
    if (result[0].count === 0) {
      // Create a new stats record
      await connection.execute(
        `INSERT INTO volunteer_stats (user_id, points, hours) VALUES (?, ?, 0)`,
        [userId, points]
      );
    } else {
      // Update existing record
      await connection.execute(
        `UPDATE volunteer_stats SET points = points + ? WHERE user_id = ?`,
        [points, userId]
      );
    }
    
    // Add log entry
    await connection.execute(
      `INSERT INTO gamification_log (user_id, type, value, reason) VALUES (?, 'points', ?, ?)`,
      [userId, points.toString(), reason]
    );
    
    await connection.commit();
    
    // Return updated stats
    return await getVolunteerStats(userId);
  } catch (error) {
    await connection.rollback();
    console.error('Error adding points:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Award a badge to a volunteer
 */
export async function awardBadge(userId: string, badge: string, reason: string): Promise<VolunteerStats> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if badge already exists
    const checkSql = `SELECT COUNT(*) as count FROM volunteer_badges WHERE user_id = ? AND badge = ?`;
    const [result] = await connection.execute<any>(checkSql, [userId, badge]);
    
    if (result[0].count === 0) {
      // Add the badge
      await connection.execute(
        `INSERT INTO volunteer_badges (user_id, badge) VALUES (?, ?)`,
        [userId, badge]
      );
      
      // Add log entry
      await connection.execute(
        `INSERT INTO gamification_log (user_id, type, value, reason) VALUES (?, 'badge', ?, ?)`,
        [userId, badge, reason]
      );
    }
    
    await connection.commit();
    
    // Return updated stats
    return await getVolunteerStats(userId);
  } catch (error) {
    await connection.rollback();
    console.error('Error awarding badge:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Log volunteer hours
 */
export async function logHours(userId: string, hours: number, reason: string): Promise<VolunteerStats> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if stats record exists
    const checkSql = `SELECT COUNT(*) as count FROM volunteer_stats WHERE user_id = ?`;
    const [result] = await connection.execute<any>(checkSql, [userId]);
    
    if (result[0].count === 0) {
      // Create a new stats record
      await connection.execute(
        `INSERT INTO volunteer_stats (user_id, points, hours) VALUES (?, 0, ?)`,
        [userId, hours]
      );
    } else {
      // Update existing record
      await connection.execute(
        `UPDATE volunteer_stats SET hours = hours + ? WHERE user_id = ?`,
        [hours, userId]
      );
    }
    
    // Add log entry
    await connection.execute(
      `INSERT INTO gamification_log (user_id, type, value, reason) VALUES (?, 'hours', ?, ?)`,
      [userId, hours.toString(), reason]
    );
    
    await connection.commit();
    
    // Return updated stats
    return await getVolunteerStats(userId);
  } catch (error) {
    await connection.rollback();
    console.error('Error logging hours:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Opportunity-related functions

/**
 * Get all opportunities with filtering options
 */
export async function getOpportunities(
  keywords?: string, 
  category?: string, 
  location?: string, 
  commitment?: string,
  organizationId?: string
): Promise<Opportunity[]> {
  let sql = `
    SELECT o.*, 
           GROUP_CONCAT(DISTINCT os.skill) as required_skills
    FROM opportunities o
    LEFT JOIN opportunity_skills os ON o.id = os.opportunity_id
  `;
  
  const whereConditions = [];
  const params = [];
  
  if (keywords) {
    whereConditions.push(`(o.title LIKE ? OR o.description LIKE ?)`);
    params.push(`%${keywords}%`, `%${keywords}%`);
  }
  
  if (category) {
    whereConditions.push(`o.category = ?`);
    params.push(category);
  }
  
  if (location) {
    whereConditions.push(`o.location LIKE ?`);
    params.push(`%${location}%`);
  }
  
  if (commitment) {
    whereConditions.push(`o.commitment = ?`);
    params.push(commitment);
  }
  
  if (organizationId) {
    whereConditions.push(`o.organization_id = ?`);
    params.push(organizationId);
  }
  
  if (whereConditions.length > 0) {
    sql += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  sql += ` GROUP BY o.id`;
  
  const opportunities = await executeQuery<any>(sql, params);
  
  return opportunities.map(opp => ({
    id: opp.id,
    title: opp.title,
    organization: opp.organization,
    organizationId: opp.organization_id,
    description: opp.description,
    location: opp.location,
    commitment: opp.commitment,
    category: opp.category,
    pointsAwarded: opp.points_awarded,
    imageUrl: opp.image_url,
    requiredSkills: opp.required_skills ? opp.required_skills.split(',') : [],
    createdAt: opp.created_at,
    updatedAt: opp.updated_at,
    applicationDeadline: opp.application_deadline,
    eventStartDate: opp.event_start_date,
    eventEndDate: opp.event_end_date
  }));
}

/**
 * Get a single opportunity by ID
 */
export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const sql = `
    SELECT o.*, 
           GROUP_CONCAT(DISTINCT os.skill) as required_skills
    FROM opportunities o
    LEFT JOIN opportunity_skills os ON o.id = os.opportunity_id
    WHERE o.id = ?
    GROUP BY o.id
  `;
  
  const opportunities = await executeQuery<any>(sql, [id]);
  
  if (opportunities.length === 0) {
    return null;
  }
  
  const opp = opportunities[0];
  
  return {
    id: opp.id,
    title: opp.title,
    organization: opp.organization,
    organizationId: opp.organization_id,
    description: opp.description,
    location: opp.location,
    commitment: opp.commitment,
    category: opp.category,
    pointsAwarded: opp.points_awarded,
    imageUrl: opp.image_url,
    requiredSkills: opp.required_skills ? opp.required_skills.split(',') : [],
    createdAt: opp.created_at,
    updatedAt: opp.updated_at,
    applicationDeadline: opp.application_deadline,
    eventStartDate: opp.event_start_date,
    eventEndDate: opp.event_end_date
  };
}

/**
 * Create a new opportunity
 */
export async function createOpportunity(opportunity: Omit<Opportunity, 'id'>): Promise<Opportunity> {
  const connection = await getConnection();
  const now = new Date();
  const newId = `opp-${now.getTime()}-${Math.random().toString(36).substring(2, 7)}`;
  
  try {
    await connection.beginTransaction();
    
    // Insert opportunity record
    const oppSql = `
      INSERT INTO opportunities (
        id, title, organization, organization_id, description, location, 
        commitment, category, points_awarded, image_url, created_at, updated_at,
        application_deadline, event_start_date, event_end_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await connection.execute(oppSql, [
      newId,
      opportunity.title,
      opportunity.organization,
      opportunity.organizationId,
      opportunity.description,
      opportunity.location,
      opportunity.commitment,
      opportunity.category,
      opportunity.pointsAwarded || 0,
      opportunity.imageUrl || null,
      now,
      now,
      opportunity.applicationDeadline || null,
      opportunity.eventStartDate || null,
      opportunity.eventEndDate || null
    ]);
    
    // Insert required skills
    if (opportunity.requiredSkills && opportunity.requiredSkills.length > 0) {
      for (const skill of opportunity.requiredSkills) {
        const skillSql = `INSERT INTO opportunity_skills (opportunity_id, skill) VALUES (?, ?)`;
        await connection.execute(skillSql, [newId, skill]);
      }
    }
    
    await connection.commit();
    
    // Return the newly created opportunity
    return {
      ...opportunity,
      id: newId,
      createdAt: now,
      updatedAt: now
    };
  } catch (error) {
    await connection.rollback();
    console.error('Error creating opportunity:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Update an opportunity
 */
export async function updateOpportunity(
  opportunityId: string,
  updates: Partial<Omit<Opportunity, 'id' | 'createdAt' | 'organizationId' | 'organization'>>
): Promise<Opportunity | null> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get the current opportunity to verify it exists
    const opportunity = await getOpportunityById(opportunityId);
    if (!opportunity) {
      return null;
    }
    
    // Update fields
    const updateFields = [];
    const params = [];
    
    if (updates.title) {
      updateFields.push('title = ?');
      params.push(updates.title);
    }
    
    if (updates.description) {
      updateFields.push('description = ?');
      params.push(updates.description);
    }
    
    if (updates.location) {
      updateFields.push('location = ?');
      params.push(updates.location);
    }
    
    if (updates.commitment) {
      updateFields.push('commitment = ?');
      params.push(updates.commitment);
    }
    
    if (updates.category) {
      updateFields.push('category = ?');
      params.push(updates.category);
    }
    
    if (updates.pointsAwarded !== undefined) {
      updateFields.push('points_awarded = ?');
      params.push(updates.pointsAwarded);
    }
    
    if (updates.imageUrl !== undefined) {
      updateFields.push('image_url = ?');
      params.push(updates.imageUrl);
    }
    
    if (updates.applicationDeadline !== undefined) {
      updateFields.push('application_deadline = ?');
      params.push(updates.applicationDeadline);
    }
    
    if (updates.eventStartDate !== undefined) {
      updateFields.push('event_start_date = ?');
      params.push(updates.eventStartDate);
    }
    
    if (updates.eventEndDate !== undefined) {
      updateFields.push('event_end_date = ?');
      params.push(updates.eventEndDate);
    }
    
    // Always update the updatedAt field
    updateFields.push('updated_at = ?');
    params.push(new Date());
    
    // Add the ID to the params
    params.push(opportunityId);
    
    // Execute the update if there are fields to update
    if (updateFields.length > 0) {
      const updateSql = `UPDATE opportunities SET ${updateFields.join(', ')} WHERE id = ?`;
      await connection.execute(updateSql, params);
    }
    
    // Update required skills if provided
    if (updates.requiredSkills) {
      // Remove existing skills
      await connection.execute('DELETE FROM opportunity_skills WHERE opportunity_id = ?', [opportunityId]);
      
      // Add new skills
      if (updates.requiredSkills.length > 0) {
        for (const skill of updates.requiredSkills) {
          await connection.execute(
            'INSERT INTO opportunity_skills (opportunity_id, skill) VALUES (?, ?)',
            [opportunityId, skill]
          );
        }
      }
    }
    
    await connection.commit();
    
    // Return the updated opportunity
    return await getOpportunityById(opportunityId);
  } catch (error) {
    await connection.rollback();
    console.error('Error updating opportunity:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Delete an opportunity
 */
export async function deleteOpportunity(opportunityId: string): Promise<boolean> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Delete associated records
    await connection.execute('DELETE FROM opportunity_skills WHERE opportunity_id = ?', [opportunityId]);
    
    // Delete the opportunity
    await connection.execute('DELETE FROM opportunities WHERE id = ?', [opportunityId]);
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting opportunity:', error);
    return false;
  } finally {
    connection.release();
  }
}

/**
 * Get all volunteers with optional filtering and sorting
 */
export async function getVolunteers(
  keywords?: string,
  sortBy?: string
): Promise<UserProfile[]> {
  // Build the base SQL query
  let sql = `
    SELECT u.*, 
           GROUP_CONCAT(DISTINCT us.skill) as skills,
           GROUP_CONCAT(DISTINCT uc.cause) as causes,
           vs.points, vs.hours
    FROM users u
    LEFT JOIN user_skills us ON u.id = us.user_id
    LEFT JOIN user_causes uc ON u.id = uc.user_id
    LEFT JOIN volunteer_stats vs ON u.id = vs.user_id
    WHERE u.role = 'volunteer'
  `;
  
  const params: any[] = [];
  
  // Add keyword search if provided
  if (keywords) {
    sql += ` AND (u.display_name LIKE ? OR u.bio LIKE ?)`;
    params.push(`%${keywords}%`, `%${keywords}%`);
  }
  
  // Group by user ID
  sql += ` GROUP BY u.id`;
  
  // Add sorting
  if (sortBy) {
    switch (sortBy) {
      case 'points_desc':
        sql += ` ORDER BY vs.points DESC`;
        break;
      case 'points_asc':
        sql += ` ORDER BY vs.points ASC`;
        break;
      case 'name_asc':
        sql += ` ORDER BY u.display_name ASC`;
        break;
      case 'name_desc':
        sql += ` ORDER BY u.display_name DESC`;
        break;
      case 'hours_desc':
        sql += ` ORDER BY vs.hours DESC`;
        break;
      case 'hours_asc':
        sql += ` ORDER BY vs.hours ASC`;
        break;
      default:
        sql += ` ORDER BY vs.points DESC`; // Default sort
    }
  } else {
    sql += ` ORDER BY vs.points DESC`; // Default sort
  }
  
  // Execute the query
  const users = await executeQuery<any>(sql, params);
  
  // Get badges for all volunteers in one query for efficiency
  const userIds = users.map(user => user.id);
  
  let badgesMap: Record<string, string[]> = {};
  
  if (userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');
    const badgesSql = `SELECT user_id, badge FROM volunteer_badges WHERE user_id IN (${placeholders})`;
    const badgesResult = await executeQuery<{user_id: string, badge: string}>(badgesSql, userIds);
    
    // Group badges by user_id
    badgesMap = badgesResult.reduce((acc: Record<string, string[]>, curr) => {
      if (!acc[curr.user_id]) {
        acc[curr.user_id] = [];
      }
      acc[curr.user_id].push(curr.badge);
      return acc;
    }, {});
  }
  
  // Transform the results into UserProfile objects
  return users.map(user => {
    // Create the base user profile
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role as UserRole,
      profilePictureUrl: user.profile_picture_url,
      bio: user.bio,
      onboardingCompleted: user.onboarding_completed === 1,
      skills: user.skills ? user.skills.split(',') : [],
      causes: user.causes ? user.causes.split(',') : [],
      stats: {
        points: user.points || 0,
        hours: user.hours || 0,
        badges: badgesMap[user.id] || []
      }
    };
    
    return userProfile;
  });
}

/**
 * Get application statistics - counts of volunteers, organizations, and opportunities
 */
export async function getAppStatistics(): Promise<{
  totalVolunteers: number;
  totalOrganizations: number;
  totalOpportunities: number;
}> {
  // Get volunteer count
  const volunteerSql = `
    SELECT COUNT(*) as count
    FROM users
    WHERE role = 'volunteer'
  `;
  const volunteerResult = await executeQuery<{count: number}>(volunteerSql);
  
  // Get organization count
  const orgSql = `
    SELECT COUNT(*) as count
    FROM users
    WHERE role = 'organization'
  `;
  const orgResult = await executeQuery<{count: number}>(orgSql);
  
  // Get opportunity count
  const oppSql = `
    SELECT COUNT(*) as count
    FROM opportunities
  `;
  const oppResult = await executeQuery<{count: number}>(oppSql);
  
  return {
    totalVolunteers: volunteerResult[0]?.count || 0,
    totalOrganizations: orgResult[0]?.count || 0,
    totalOpportunities: oppResult[0]?.count || 0
  };
}

// Messaging-related functions

/**
 * Create a new conversation or return an existing one
 */
export async function createConversation(data: {
  organizationId: string;
  volunteerId: string;
  opportunityId: string;
  initialMessage: string;
  opportunityTitle?: string;
  organizationName?: string;
  volunteerName?: string;
}): Promise<Conversation> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if a conversation already exists between these parties for this opportunity
    const checkSql = `
      SELECT id FROM conversations 
      WHERE organization_id = ? AND volunteer_id = ? AND opportunity_id = ?
    `;
    const existingConversations = await executeQuery<{id: string}>(checkSql, [
      data.organizationId, 
      data.volunteerId, 
      data.opportunityId
    ]);
    
    let conversationId: string;
    const now = new Date();
    
    if (existingConversations.length > 0) {
      // Conversation already exists, use that ID
      conversationId = existingConversations[0].id;
      
      // Update the conversation's updatedAt timestamp
      await connection.execute(
        `UPDATE conversations SET updated_at = ? WHERE id = ?`,
        [now, conversationId]
      );
    } else {
      // Create a new conversation
      conversationId = `convo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      // Get organization and volunteer names if not provided
      if (!data.organizationName || !data.volunteerName || !data.opportunityTitle) {
        const orgUser = await getUserById(data.organizationId);
        const volunteerUser = await getUserById(data.volunteerId);
        const opportunity = await getOpportunityById(data.opportunityId);
        
        data.organizationName = data.organizationName || orgUser?.displayName || `Org (${data.organizationId.substring(0, 4)})`;
        data.volunteerName = data.volunteerName || volunteerUser?.displayName || `Volunteer (${data.volunteerId.substring(0, 4)})`;
        data.opportunityTitle = data.opportunityTitle || opportunity?.title || 'Unknown Opportunity';
      }
      
      // Insert the new conversation
      await connection.execute(
        `INSERT INTO conversations (
          id, organization_id, volunteer_id, opportunity_id, 
          opportunity_title, organization_name, volunteer_name,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          conversationId,
          data.organizationId,
          data.volunteerId,
          data.opportunityId,
          data.opportunityTitle,
          data.organizationName,
          data.volunteerName,
          now,
          now
        ]
      );
    }
    
    // Add the initial message
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await connection.execute(
      `INSERT INTO messages (id, conversation_id, sender_id, text, timestamp, is_read)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        messageId,
        conversationId,
        data.organizationId, // Assuming the organization sends the first message
        data.initialMessage,
        now,
        false
      ]
    );
    
    await connection.commit();
    
    // Get the full conversation with the new message
    const conversation = await getConversationDetails(conversationId, data.organizationId, 'organization');
    return conversation.conversation;
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating conversation:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get conversations for a user
 */
export async function getConversationsForUser(
  userId: string, 
  userRole: 'volunteer' | 'organization'
): Promise<(Conversation & { unreadCount: number })[]> {
  // Determine which field to filter on based on user role
  const roleField = userRole === 'volunteer' ? 'volunteer_id' : 'organization_id';
  
  // Get all conversations for this user
  const conversationsSql = `
    SELECT c.*,
           (SELECT COUNT(*) FROM messages m 
            WHERE m.conversation_id = c.id 
            AND m.sender_id != ? 
            AND m.is_read = 0) as unread_count,
           (SELECT m.id FROM messages m 
            WHERE m.conversation_id = c.id 
            ORDER BY m.timestamp DESC LIMIT 1) as last_message_id,
           (SELECT m.sender_id FROM messages m 
            WHERE m.conversation_id = c.id 
            ORDER BY m.timestamp DESC LIMIT 1) as last_message_sender,
           (SELECT m.text FROM messages m 
            WHERE m.conversation_id = c.id 
            ORDER BY m.timestamp DESC LIMIT 1) as last_message_text,
           (SELECT m.timestamp FROM messages m 
            WHERE m.conversation_id = c.id 
            ORDER BY m.timestamp DESC LIMIT 1) as last_message_timestamp,
           (SELECT m.is_read FROM messages m 
            WHERE m.conversation_id = c.id 
            ORDER BY m.timestamp DESC LIMIT 1) as last_message_is_read
    FROM conversations c
    WHERE c.${roleField} = ?
    ORDER BY c.updated_at DESC
  `;
  
  const conversations = await executeQuery<any>(conversationsSql, [userId, userId]);
  
  // Transform the results into Conversation objects
  return conversations.map(conv => {
    // Create the last message object if one exists
    const lastMessage = conv.last_message_id ? {
      id: conv.last_message_id,
      conversationId: conv.id,
      senderId: conv.last_message_sender,
      text: conv.last_message_text,
      timestamp: conv.last_message_timestamp,
      isRead: conv.last_message_is_read === 1
    } : undefined;
    
    // Create the conversation object
    return {
      id: conv.id,
      organizationId: conv.organization_id,
      volunteerId: conv.volunteer_id,
      opportunityId: conv.opportunity_id,
      opportunityTitle: conv.opportunity_title,
      organizationName: conv.organization_name,
      volunteerName: conv.volunteer_name,
      messages: [], // Will be populated when getting conversation details
      lastMessage,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      unreadCount: conv.unread_count
    };
  });
}

/**
 * Get details for a specific conversation
 */
export async function getConversationDetails(
  conversationId: string,
  userId: string,
  userRole: 'volunteer' | 'organization'
): Promise<{ conversation: Conversation; messages: Message[] }> {
  // Get the conversation
  const conversationSql = `
    SELECT c.*
    FROM conversations c
    WHERE c.id = ?
  `;
  
  const conversations = await executeQuery<any>(conversationSql, [conversationId]);
  
  if (conversations.length === 0) {
    throw new Error('Conversation not found');
  }
  
  const conv = conversations[0];
  
  // Get all messages for this conversation
  const messagesSql = `
    SELECT m.*
    FROM messages m
    WHERE m.conversation_id = ?
    ORDER BY m.timestamp ASC
  `;
  
  const messagesResult = await executeQuery<any>(messagesSql, [conversationId]);
  
  // Transform the messages
  const messages = messagesResult.map((msg: any) => ({
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    text: msg.text,
    timestamp: msg.timestamp,
    isRead: msg.is_read === 1
  }));
  
  // Mark messages as read if the user is the recipient
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    
    // Determine if the user is the volunteer or organization
    const isVolunteer = userRole === 'volunteer';
    const otherPartyId = isVolunteer ? conv.organization_id : conv.volunteer_id;
    
    // Mark unread messages from the other party as read
    await connection.execute(
      `UPDATE messages 
       SET is_read = 1 
       WHERE conversation_id = ? AND sender_id = ? AND is_read = 0`,
      [conversationId, otherPartyId]
    );
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error('Error marking messages as read:', error);
  } finally {
    connection.release();
  }
  
  // Create the conversation object
  const conversation: Conversation = {
    id: conv.id,
    organizationId: conv.organization_id,
    volunteerId: conv.volunteer_id,
    opportunityId: conv.opportunity_id,
    opportunityTitle: conv.opportunity_title,
    organizationName: conv.organization_name,
    volunteerName: conv.volunteer_name,
    messages,
    lastMessage: messages.length > 0 ? messages[messages.length - 1] : undefined,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at
  };
  
  return { conversation, messages };
}

/**
 * Send a new message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<Message> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if the conversation exists
    const checkSql = `SELECT id FROM conversations WHERE id = ?`;
    const conversations = await executeQuery<{id: string}>(checkSql, [conversationId]);
    
    if (conversations.length === 0) {
      throw new Error('Conversation not found');
    }
    
    // Create a new message
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    
    // Insert the message
    await connection.execute(
      `INSERT INTO messages (id, conversation_id, sender_id, text, timestamp, is_read)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        messageId,
        conversationId,
        senderId,
        text,
        now,
        false
      ]
    );
    
    // Update the conversation's updatedAt timestamp
    await connection.execute(
      `UPDATE conversations SET updated_at = ? WHERE id = ?`,
      [now, conversationId]
    );
    
    await connection.commit();
    
    // Return the new message
    return {
      id: messageId,
      conversationId,
      senderId,
      text,
      timestamp: now,
      isRead: false
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('Error sending message:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Notification-related functions

/**
 * Create a new notification for a user
 */
export async function createNotification(userId: string, message: string, link?: string): Promise<UserNotification> {
  // Generate a unique ID for the notification
  const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();
  
  // Insert the notification into the database
  const sql = `
    INSERT INTO notifications (id, userId, type, message, isRead, relatedEntityId, relatedEntityType, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  // Using "link" as relatedEntityId and "notification" as type
  await executeQuery(sql, [notificationId, userId, 'notification', message, false, link || null, link ? 'link' : null, now]);
  
  // Return the newly created notification
  return {
    id: notificationId,
    userId: userId,
    message: message,
    link: link,
    isRead: false,
    timestamp: now
  };
}

/**
 * Get notifications for a specific user
 */
export async function getNotificationsForUser(userId: string): Promise<UserNotification[]> {
  // Query notifications from the database
  const sql = `
    SELECT id, userId, message, relatedEntityId as link, isRead, createdAt as timestamp
    FROM notifications
    WHERE userId = ?
    ORDER BY createdAt DESC
    LIMIT 50
  `;
  
  const notifications = await executeQuery<any>(sql, [userId]);
  
  // Transform the database results into UserNotification objects
  return notifications.map(notification => ({
    id: notification.id,
    userId: notification.userId,
    message: notification.message,
    link: notification.link,
    isRead: notification.isRead === 1,
    timestamp: notification.timestamp
  }));
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string): Promise<UserNotification | null> {
  // Update the notification in the database
  const updateSql = `
    UPDATE notifications
    SET isRead = 1
    WHERE id = ? AND userId = ?
  `;
  
  const result = await executeQuery<any>(updateSql, [notificationId, userId]);
  
  // If no rows were affected, the notification doesn't exist or doesn't belong to the user
  if (!(result as any).affectedRows || (result as any).affectedRows === 0) {
    return null;
  }
  
  // Get the updated notification
  const getSql = `
    SELECT id, userId, message, relatedEntityId as link, isRead, createdAt as timestamp
    FROM notifications
    WHERE id = ?
  `;
  
  const notifications = await executeQuery<any>(getSql, [notificationId]);
  
  if (notifications.length === 0) {
    return null;
  }
  
  const notification = notifications[0];
  
  // Return the updated notification
  return {
    id: notification.id,
    userId: notification.userId,
    message: notification.message,
    link: notification.link,
    isRead: notification.isRead === 1,
    timestamp: notification.timestamp
  };
}

/**
 * Mark all notifications as read for a specific user
 */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  // Update all unread notifications for the user
  const sql = `
    UPDATE notifications
    SET isRead = 1
    WHERE userId = ? AND isRead = 0
  `;
  
  const result = await executeQuery<any>(sql, [userId]);
  
  // Return the number of notifications that were marked as read
  return (result as any).affectedRows || 0;
}

// Application-related functions

/**
 * Get applications for a specific organization
 */
export async function getApplicationsForOrganization(organizationId: string): Promise<VolunteerApplication[]> {
  // First get all opportunities for this organization
  const oppsSql = `
    SELECT id FROM opportunities WHERE organization_id = ?
  `;
  
  const opps = await executeQuery<{id: string}>(oppsSql, [organizationId]);
  
  if (opps.length === 0) {
    return []; // No opportunities, so no applications
  }
  
  // Get the opportunity IDs
  const oppIds = opps.map(opp => opp.id);
  const placeholders = oppIds.map(() => '?').join(',');
  
  // Get all applications for these opportunities
  const appsSql = `
    SELECT * FROM applications 
    WHERE opportunity_id IN (${placeholders})
    ORDER BY submitted_at DESC
  `;
  
  const applications = await executeQuery<any>(appsSql, oppIds);
  
  // Transform the results
  return applications.map(app => ({
    id: app.id,
    opportunityId: app.opportunity_id,
    opportunityTitle: app.opportunity_title,
    volunteerId: app.volunteer_id,
    applicantName: app.applicant_name,
    applicantEmail: app.applicant_email,
    resumeUrl: app.resume_url || '',
    coverLetter: app.cover_letter || '',
    status: app.status,
    submittedAt: app.submitted_at,
    attendance: app.attendance || 'pending',
    orgRating: app.org_rating,
    hoursLoggedByOrg: app.hours_logged_by_org
  }));
}

/**
 * Get applications for a specific volunteer
 */
export async function getApplicationsForVolunteer(volunteerId: string): Promise<VolunteerApplication[]> {
  const sql = `
    SELECT * FROM applications 
    WHERE volunteer_id = ?
    ORDER BY submitted_at DESC
  `;
  
  const applications = await executeQuery<any>(sql, [volunteerId]);
  
  // Transform the results
  return applications.map(app => ({
    id: app.id,
    opportunityId: app.opportunity_id,
    opportunityTitle: app.opportunity_title,
    volunteerId: app.volunteer_id,
    applicantName: app.applicant_name,
    applicantEmail: app.applicant_email,
    resumeUrl: app.resume_url || '',
    coverLetter: app.cover_letter || '',
    status: app.status,
    submittedAt: app.submitted_at,
    attendance: app.attendance || 'pending',
    orgRating: app.org_rating,
    hoursLoggedByOrg: app.hours_logged_by_org
  }));
}

/**
 * Submit a volunteer application
 */
export async function submitVolunteerApplication(application: Omit<VolunteerApplication, 'id'>): Promise<string> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Generate a unique ID
    const appId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Insert the application
    const sql = `
      INSERT INTO applications (
        id, opportunity_id, opportunity_title, volunteer_id, 
        applicant_name, applicant_email, resume_url, cover_letter, 
        status, submitted_at, attendance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await connection.execute(sql, [
      appId,
      application.opportunityId,
      application.opportunityTitle,
      application.volunteerId,
      application.applicantName,
      application.applicantEmail,
      application.resumeUrl || null,
      application.coverLetter || null,
      'submitted', // Default status
      new Date(),
      'pending' // Default attendance
    ]);
    
    // Get the organization ID for this opportunity
    const oppSql = `SELECT organization_id FROM opportunities WHERE id = ?`;
    const oppResult = await connection.execute<any>(oppSql, [application.opportunityId]);
    
    if (oppResult[0].length > 0) {
      const organizationId = oppResult[0][0].organization_id;
      
      // Create a notification for the organization
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const notifSql = `
        INSERT INTO notifications (id, userId, type, message, isRead, relatedEntityId, relatedEntityType, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(notifSql, [
        notifId,
        organizationId,
        'application',
        `New application from ${application.applicantName} for "${application.opportunityTitle}"`,
        false,
        '/dashboard/organization/applications',
        'link',
        new Date()
      ]);
    }
    
    await connection.commit();
    return appId;
    
  } catch (error) {
    await connection.rollback();
    console.error('Error submitting application:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Update an application's status
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: 'accepted' | 'rejected' | 'completed' | 'withdrawn'
): Promise<VolunteerApplication> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Update the application status
    const updateSql = `
      UPDATE applications 
      SET status = ? 
      WHERE id = ?
    `;
    
    await connection.execute(updateSql, [status, applicationId]);
    
    // Get the updated application
    const getSql = `SELECT * FROM applications WHERE id = ?`;
    const appResult = await connection.execute<any>(getSql, [applicationId]);
    
    if (appResult[0].length === 0) {
      throw new Error('Application not found after update');
    }
    
    const app = appResult[0][0];
    
    // Create a notification for the volunteer
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const statusMessage = status === 'accepted' ? 'accepted' : 
                          status === 'rejected' ? 'rejected' :
                          status === 'completed' ? 'marked as completed' : 'withdrawn';
    
    const notifSql = `
      INSERT INTO notifications (id, userId, type, message, isRead, relatedEntityId, relatedEntityType, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await connection.execute(notifSql, [
      notifId,
      app.volunteer_id,
      'status_update',
      `Your application for "${app.opportunity_title}" has been ${statusMessage}.`,
      false,
      '/dashboard/volunteer/applications',
      'link',
      new Date()
    ]);
    
    await connection.commit();
    
    // Transform and return the updated application
    return {
      id: app.id,
      opportunityId: app.opportunity_id,
      opportunityTitle: app.opportunity_title,
      volunteerId: app.volunteer_id,
      applicantName: app.applicant_name,
      applicantEmail: app.applicant_email,
      resumeUrl: app.resume_url || '',
      coverLetter: app.cover_letter || '',
      status: app.status,
      submittedAt: app.submitted_at,
      attendance: app.attendance || 'pending',
      orgRating: app.org_rating,
      hoursLoggedByOrg: app.hours_logged_by_org
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating application status:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Record volunteer performance
 */
export async function recordVolunteerPerformance(
  applicationId: string,
  feedbackData: {
    attendance: 'present' | 'absent' | 'pending';
    orgRating?: number;
    hoursLoggedByOrg?: number;
  }
): Promise<VolunteerApplication> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Update the application with feedback data
    const updateFields = [];
    const params = [];
    
    updateFields.push('attendance = ?');
    params.push(feedbackData.attendance);
    
    if (feedbackData.orgRating !== undefined) {
      updateFields.push('org_rating = ?');
      params.push(feedbackData.orgRating);
    }
    
    if (feedbackData.hoursLoggedByOrg !== undefined) {
      updateFields.push('hours_logged_by_org = ?');
      params.push(feedbackData.hoursLoggedByOrg);
    }
    
    // If attendance is marked as 'present', also update status to 'completed'
    if (feedbackData.attendance === 'present') {
      updateFields.push('status = ?');
      params.push('completed');
    }
    
    params.push(applicationId);
    
    const updateSql = `
      UPDATE applications 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    await connection.execute(updateSql, params);
    
    // Get the updated application
    const getSql = `
      SELECT a.*, o.points_awarded
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE a.id = ?
    `;
    
    const appResult = await connection.execute<any>(getSql, [applicationId]);
    
    if (appResult[0].length === 0) {
      throw new Error('Application not found after update');
    }
    
    const app = appResult[0][0];
    
    // If attendance is 'present', award points and log hours
    if (feedbackData.attendance === 'present') {
      // Award points
      if (app.points_awarded) {
        const awardPointsSql = `
          UPDATE volunteer_stats 
          SET points = points + ? 
          WHERE user_id = ?
        `;
        
        await connection.execute(awardPointsSql, [app.points_awarded, app.volunteer_id]);
        
        // Log the points
        const pointsLogSql = `
          INSERT INTO gamification_log (user_id, type, value, reason)
          VALUES (?, 'points', ?, ?)
        `;
        
        await connection.execute(pointsLogSql, [
          app.volunteer_id,
          app.points_awarded.toString(),
          `Completed opportunity: ${app.opportunity_title}`
        ]);
      }
      
      // Log hours
      if (feedbackData.hoursLoggedByOrg && feedbackData.hoursLoggedByOrg > 0) {
        const logHoursSql = `
          UPDATE volunteer_stats 
          SET hours = hours + ? 
          WHERE user_id = ?
        `;
        
        await connection.execute(logHoursSql, [feedbackData.hoursLoggedByOrg, app.volunteer_id]);
        
        // Log the hours
        const hoursLogSql = `
          INSERT INTO gamification_log (user_id, type, value, reason)
          VALUES (?, 'hours', ?, ?)
        `;
        
        await connection.execute(hoursLogSql, [
          app.volunteer_id,
          feedbackData.hoursLoggedByOrg.toString(),
          `Volunteered for: ${app.opportunity_title}`
        ]);
      }
      
      // Create a notification for the volunteer
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const notifSql = `
        INSERT INTO notifications (id, userId, type, message, isRead, relatedEntityId, relatedEntityType, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(notifSql, [
        notifId,
        app.volunteer_id,
        'performance',
        `You've earned ${app.points_awarded || 0} points and logged ${feedbackData.hoursLoggedByOrg || 0} hours for "${app.opportunity_title}".`,
        false,
        '/dashboard/volunteer',
        'link',
        new Date()
      ]);
    }
    
    await connection.commit();
    
    // Transform and return the updated application
    return {
      id: app.id,
      opportunityId: app.opportunity_id,
      opportunityTitle: app.opportunity_title,
      volunteerId: app.volunteer_id,
      applicantName: app.applicant_name,
      applicantEmail: app.applicant_email,
      resumeUrl: app.resume_url || '',
      coverLetter: app.cover_letter || '',
      status: app.status,
      submittedAt: app.submitted_at,
      attendance: app.attendance,
      orgRating: app.org_rating,
      hoursLoggedByOrg: app.hours_logged_by_org
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('Error recording volunteer performance:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Initialize the database connection pool
initializeDb();

// Export types for easy access
export type { UserProfile, UserRole, VolunteerStats, Opportunity, VolunteerApplication, Conversation, Message, AdminReport }; 