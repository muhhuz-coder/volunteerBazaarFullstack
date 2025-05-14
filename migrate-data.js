// migrate-data.js
// Script to migrate JSON data to MySQL database

const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',  // Replace with your MySQL username
  password: 'huzaifa123',  // Replace with your MySQL password
  database: 'volunteer_bazaar',
};

// Paths to the JSON data files
const DATA_DIR = path.resolve(process.cwd(), 'src/data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OPPORTUNITIES_FILE = path.join(DATA_DIR, 'opportunities.json');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
const USER_STATS_FILE = path.join(DATA_DIR, 'user-stats.json');
const GAMIFICATION_LOG_FILE = path.join(DATA_DIR, 'gamification-log.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Helper function to read JSON data with a default value
async function readJsonData(filePath, defaultValue) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    if (!fileContent || fileContent.trim() === '') {
      return defaultValue;
    }
    return JSON.parse(fileContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Data file ${filePath} not found. Using default value.`);
      return defaultValue;
    }
    console.error(`Error reading data file ${filePath}:`, error);
    return defaultValue;
  }
}

// Date reviver for parsing dates in JSON
function dateReviver(key, value) {
  const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
  if (typeof value === 'string' && dateFormat.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return value;
}

// Helper function to insert data with manual transaction handling
async function insertData(conn, query, params) {
  try {
    const [result] = await conn.execute(query, params);
    return result;
  } catch (error) {
    console.error(`Error executing query: ${query}`);
    console.error('Parameters:', params);
    console.error('Error:', error);
    throw error;
  }
}

// Migrate users data
async function migrateUsers(conn, usersData) {
  console.log('Migrating users data...');
  
  for (const [email, user] of Object.entries(usersData)) {
    // Insert user
    const userQuery = `
      INSERT INTO users (id, email, display_name, role, hashed_password, profile_picture_url, bio, onboarding_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await insertData(conn, userQuery, [
      user.id,
      email,
      user.displayName,
      user.role,
      user.hashedPassword || '',
      user.profilePictureUrl || null,
      user.bio || null,
      user.onboardingCompleted || false
    ]);
    
    // Insert skills
    if (user.skills && user.skills.length > 0) {
      for (const skill of user.skills) {
        const skillQuery = `INSERT INTO user_skills (user_id, skill) VALUES (?, ?)`;
        await insertData(conn, skillQuery, [user.id, skill]);
      }
    }
    
    // Insert causes
    if (user.causes && user.causes.length > 0) {
      for (const cause of user.causes) {
        const causeQuery = `INSERT INTO user_causes (user_id, cause) VALUES (?, ?)`;
        await insertData(conn, causeQuery, [user.id, cause]);
      }
    }
    
    // Initialize volunteer stats if user is a volunteer
    if (user.role === 'volunteer') {
      const statsQuery = `
        INSERT INTO volunteer_stats (user_id, points, hours)
        VALUES (?, ?, ?)
      `;
      const points = user.stats?.points || 0;
      const hours = user.stats?.hours || 0;
      await insertData(conn, statsQuery, [user.id, points, hours]);
      
      // Insert badges
      if (user.stats?.badges && user.stats.badges.length > 0) {
        for (const badge of user.stats.badges) {
          const badgeQuery = `INSERT INTO volunteer_badges (user_id, badge) VALUES (?, ?)`;
          await insertData(conn, badgeQuery, [user.id, badge]);
        }
      }
    }
  }
  
  console.log('Users migration completed');
}

// Migrate opportunities data
async function migrateOpportunities(conn, opportunitiesData) {
  console.log('Migrating opportunities data...');
  
  for (const opportunity of opportunitiesData) {
    // Insert opportunity
    const oppQuery = `
      INSERT INTO opportunities (
        id, title, organization, organization_id, description, location, 
        commitment, category, points_awarded, image_url, created_at, updated_at,
        application_deadline, event_start_date, event_end_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await insertData(conn, oppQuery, [
      opportunity.id,
      opportunity.title,
      opportunity.organization,
      opportunity.organizationId,
      opportunity.description,
      opportunity.location,
      opportunity.commitment,
      opportunity.category,
      opportunity.pointsAwarded || 0,
      opportunity.imageUrl || null,
      opportunity.createdAt ? new Date(opportunity.createdAt) : new Date(),
      opportunity.updatedAt ? new Date(opportunity.updatedAt) : new Date(),
      opportunity.applicationDeadline ? new Date(opportunity.applicationDeadline) : null,
      opportunity.eventStartDate ? new Date(opportunity.eventStartDate) : null,
      opportunity.eventEndDate ? new Date(opportunity.eventEndDate) : null
    ]);
    
    // Insert required skills
    if (opportunity.requiredSkills && opportunity.requiredSkills.length > 0) {
      for (const skill of opportunity.requiredSkills) {
        const skillQuery = `INSERT INTO opportunity_skills (opportunity_id, skill) VALUES (?, ?)`;
        await insertData(conn, skillQuery, [opportunity.id, skill]);
      }
    }
  }
  
  console.log('Opportunities migration completed');
}

// Migrate applications data
async function migrateApplications(conn, applicationsData) {
  console.log('Migrating applications data...');
  
  for (const app of applicationsData) {
    const appQuery = `
      INSERT INTO applications (
        id, opportunity_id, opportunity_title, volunteer_id, applicant_name,
        applicant_email, resume_url, cover_letter, status, submitted_at,
        attendance, org_rating, hours_logged_by_org
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await insertData(conn, appQuery, [
      app.id,
      app.opportunityId,
      app.opportunityTitle,
      app.volunteerId,
      app.applicantName,
      app.applicantEmail,
      app.resumeUrl || null,
      app.coverLetter || null,
      app.status,
      app.submittedAt ? new Date(app.submittedAt) : new Date(),
      app.attendance || null,
      app.orgRating || null,
      app.hoursLoggedByOrg || null
    ]);
  }
  
  console.log('Applications migration completed');
}

// Migrate gamification log data
async function migrateGamificationLog(conn, logData) {
  console.log('Migrating gamification log data...');
  
  for (const entry of logData) {
    const logQuery = `
      INSERT INTO gamification_log (user_id, type, value, reason, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await insertData(conn, logQuery, [
      entry.userId,
      entry.type,
      entry.value.toString(), // Convert to string as the value could be number or string
      entry.reason,
      entry.timestamp ? new Date(entry.timestamp) : new Date()
    ]);
  }
  
  console.log('Gamification log migration completed');
}

// Migrate conversations and messages data
async function migrateConversations(conn, conversationsData) {
  console.log('Migrating conversations and messages data...');
  
  for (const convo of conversationsData) {
    // Insert conversation
    const convoQuery = `
      INSERT INTO conversations (
        id, organization_id, volunteer_id, opportunity_id, opportunity_title,
        organization_name, volunteer_name, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await insertData(conn, convoQuery, [
      convo.id,
      convo.organizationId,
      convo.volunteerId,
      convo.opportunityId,
      convo.opportunityTitle || null,
      convo.organizationName || null,
      convo.volunteerName || null,
      convo.createdAt ? new Date(convo.createdAt) : new Date(),
      convo.updatedAt ? new Date(convo.updatedAt) : new Date()
    ]);
    
    // Insert messages
    if (convo.messages && convo.messages.length > 0) {
      for (const msg of convo.messages) {
        const msgQuery = `
          INSERT INTO messages (id, conversation_id, sender_id, text, timestamp, is_read)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await insertData(conn, msgQuery, [
          msg.id,
          msg.conversationId,
          msg.senderId,
          msg.text,
          msg.timestamp ? new Date(msg.timestamp) : new Date(),
          msg.isRead || false
        ]);
      }
    }
  }
  
  console.log('Conversations and messages migration completed');
}

// Migrate admin reports data
async function migrateReports(conn, reportsData) {
  console.log('Migrating admin reports data...');
  
  for (const report of reportsData) {
    const reportQuery = `
      INSERT INTO admin_reports (
        id, reporter_id, reported_user_id, reason, timestamp, status,
        admin_notes, resolved_by, resolved_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await insertData(conn, reportQuery, [
      report.id,
      report.reporterId,
      report.reportedUserId,
      report.reason,
      report.timestamp ? new Date(report.timestamp) : new Date(),
      report.status || 'pending',
      report.adminNotes || null,
      report.resolvedBy || null,
      report.resolvedAt ? new Date(report.resolvedAt) : null
    ]);
  }
  
  console.log('Admin reports migration completed');
}

// Main migration function
async function migrateData() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    
    // Begin transaction
    await connection.beginTransaction();
    console.log('Started database transaction');
    
    // Read data from JSON files
    const usersData = await readJsonData(USERS_FILE, {});
    const opportunitiesData = await readJsonData(OPPORTUNITIES_FILE, []);
    const applicationsData = await readJsonData(APPLICATIONS_FILE, []);
    const userStatsData = await readJsonData(USER_STATS_FILE, {});
    const gamificationLogData = await readJsonData(GAMIFICATION_LOG_FILE, []);
    const conversationsData = await readJsonData(CONVERSATIONS_FILE, []);
    const reportsData = await readJsonData(REPORTS_FILE, []);
    
    // Migrate all data
    await migrateUsers(connection, usersData);
    await migrateOpportunities(connection, opportunitiesData);
    await migrateApplications(connection, applicationsData);
    await migrateGamificationLog(connection, gamificationLogData);
    await migrateConversations(connection, conversationsData);
    await migrateReports(connection, reportsData);
    
    // Commit transaction
    await connection.commit();
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
      console.log('Transaction rolled back due to error');
    }
  } finally {
    // Close connection
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
migrateData().catch(err => {
  console.error('Unhandled error in migration:', err);
  process.exit(1);
}); 