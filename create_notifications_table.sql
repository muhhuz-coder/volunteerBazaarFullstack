-- Create notifications table for Volunteer Bazaar

-- Use the volunteer_bazaar database
USE volunteer_bazaar;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for efficient querying
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Insert sample notifications for volunteers
INSERT IGNORE INTO notifications (id, user_id, message, link, is_read, timestamp)
VALUES 
-- Notifications for John (vol_123456)
('notif-john-1', 'vol_123456', 'Welcome to Volunteer Bazaar! Complete your profile to get started.', '/dashboard/volunteer', 1, NOW() - INTERVAL 5 DAY),
('notif-john-2', 'vol_123456', 'Your application for "Disaster Relief Volunteer" was received.', '/dashboard/volunteer/applications', 1, NOW() - INTERVAL 3 DAY),
('notif-john-3', 'vol_123456', 'Red Cross Chapter sent you a message.', '/dashboard/messages', 0, NOW() - INTERVAL 1 HOUR),

-- Notifications for Sarah (vol_234567)
('notif-sarah-1', 'vol_234567', 'Welcome to Volunteer Bazaar! Complete your profile to get started.', '/dashboard/volunteer', 1, NOW() - INTERVAL 4 DAY),
('notif-sarah-2', 'vol_234567', 'Your application for "Food Drive Coordinator" was received.', '/dashboard/volunteer/applications', 1, NOW() - INTERVAL 2 DAY),
('notif-sarah-3', 'vol_234567', 'Food Bank Network sent you a message.', '/dashboard/messages', 0, NOW() - INTERVAL 3 HOUR),

-- Notifications for organizations
('notif-redcross-1', 'org_123456', 'John Volunteer applied for your "Disaster Relief Volunteer" opportunity.', '/dashboard/organization/applications', 1, NOW() - INTERVAL 3 DAY),
('notif-redcross-2', 'org_123456', 'You have a new message from John Volunteer.', '/dashboard/messages', 0, NOW() - INTERVAL 1 DAY),
('notif-foodbank-1', 'org_234567', 'Sarah Helper applied for your "Food Drive Coordinator" opportunity.', '/dashboard/organization/applications', 1, NOW() - INTERVAL 2 DAY);

-- Output confirmation
SELECT 'Notifications table created and sample data inserted successfully' AS 'Status'; 