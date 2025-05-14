-- MySQL database setup for Volunteer Bazaar
-- This script creates the required tables and relationships

-- Drop database if it exists and create it anew
DROP DATABASE IF EXISTS volunteer_bazaar;
CREATE DATABASE volunteer_bazaar;
USE volunteer_bazaar;

-- Create users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    role ENUM('volunteer', 'organization', 'admin') NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    profile_picture_url LONGTEXT,
    bio TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create user_skills table
CREATE TABLE user_skills (
    user_id VARCHAR(50) NOT NULL,
    skill VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, skill),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_causes table
CREATE TABLE user_causes (
    user_id VARCHAR(50) NOT NULL,
    cause VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, cause),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create volunteer_stats table
CREATE TABLE volunteer_stats (
    user_id VARCHAR(50) PRIMARY KEY,
    points INT NOT NULL DEFAULT 0,
    hours FLOAT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create volunteer_badges table
CREATE TABLE volunteer_badges (
    user_id VARCHAR(50) NOT NULL,
    badge VARCHAR(100) NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create gamification_log table
CREATE TABLE gamification_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    type ENUM('points', 'badge', 'hours') NOT NULL,
    value VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create opportunities table
CREATE TABLE opportunities (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL,
    organization_id VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    commitment VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    points_awarded INT DEFAULT 0,
    image_url LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    application_deadline DATETIME,
    event_start_date DATETIME,
    event_end_date DATETIME,
    FOREIGN KEY (organization_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create opportunity_skills table
CREATE TABLE opportunity_skills (
    opportunity_id VARCHAR(50) NOT NULL,
    skill VARCHAR(100) NOT NULL,
    PRIMARY KEY (opportunity_id, skill),
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
);

-- Create applications table
CREATE TABLE applications (
    id VARCHAR(50) PRIMARY KEY,
    opportunity_id VARCHAR(50) NOT NULL,
    opportunity_title VARCHAR(255) NOT NULL,
    volunteer_id VARCHAR(50) NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    resume_url LONGTEXT,
    cover_letter TEXT,
    status ENUM('submitted', 'accepted', 'rejected', 'withdrawn', 'completed') NOT NULL DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attendance ENUM('present', 'absent', 'pending'),
    org_rating INT,
    hours_logged_by_org FLOAT,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    FOREIGN KEY (volunteer_id) REFERENCES users(id)
);

-- Create conversations table
CREATE TABLE conversations (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) NOT NULL,
    volunteer_id VARCHAR(50) NOT NULL,
    opportunity_id VARCHAR(50) NOT NULL,
    opportunity_title VARCHAR(255),
    organization_name VARCHAR(255),
    volunteer_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES users(id),
    FOREIGN KEY (volunteer_id) REFERENCES users(id),
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
);

-- Create messages table
CREATE TABLE messages (
    id VARCHAR(50) PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Create admin_reports table
CREATE TABLE admin_reports (
    id VARCHAR(50) PRIMARY KEY,
    reporter_id VARCHAR(50) NOT NULL,
    reported_user_id VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by VARCHAR(50),
    resolved_at TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_user_id) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Add indexes for better performance
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_opportunities_organization_id ON opportunities(organization_id);
CREATE INDEX idx_applications_volunteer_id ON applications(volunteer_id);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_conversations_volunteer_id ON conversations(volunteer_id);
CREATE INDEX idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_admin_reports_status ON admin_reports(status);

-- Create a function to migrate data from JSON to MySQL
-- Note: You'll need to implement the actual data migration with a separate script
DELIMITER //
CREATE PROCEDURE migrate_json_data()
BEGIN
    -- This is a placeholder for the actual migration procedure
    -- You would implement logic here to read from your JSON files and insert into MySQL tables
    -- Data migration should be performed with a separate script (Node.js, Python, etc.)
    -- that reads your JSON files and inserts the data into these MySQL tables
    SELECT 'Data migration procedure would be here' AS message;
END //
DELIMITER ;

-- Create a stored procedure to get unread message count for a conversation
DELIMITER //
CREATE PROCEDURE get_unread_count(IN p_conversation_id VARCHAR(50), IN p_user_id VARCHAR(50), OUT p_unread_count INT)
BEGIN
    SELECT COUNT(*) INTO p_unread_count
    FROM messages
    WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE;
END //
DELIMITER ;

-- Create a stored procedure to get the top volunteers for the leaderboard
DELIMITER //
CREATE PROCEDURE get_leaderboard(IN limit_count INT)
BEGIN
    SELECT u.id AS user_id, u.display_name AS user_name, vs.points 
    FROM users u
    JOIN volunteer_stats vs ON u.id = vs.user_id
    WHERE u.role = 'volunteer'
    ORDER BY vs.points DESC
    LIMIT limit_count;
END //
DELIMITER ;

-- Output a success message
SELECT 'Volunteer Bazaar database setup complete' AS 'Status'; 