-- Create applications table and insert sample data

-- Use the volunteer_bazaar database
USE volunteer_bazaar;

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS applications (
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
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_volunteer_id ON applications(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Insert sample applications
INSERT IGNORE INTO applications (
    id, 
    opportunity_id, 
    opportunity_title, 
    volunteer_id, 
    applicant_name, 
    applicant_email, 
    resume_url, 
    cover_letter, 
    status, 
    submitted_at, 
    attendance, 
    org_rating, 
    hours_logged_by_org
) VALUES
-- John's applications
('app-john-1', 'opp-345678', 'Disaster Relief Volunteer', 'vol_123456', 'John Volunteer', 'john@example.com', 
 NULL, 'I am excited to help with disaster relief efforts. I have experience in first aid and emergency response.', 
 'accepted', NOW() - INTERVAL 3 DAY, 'pending', NULL, NULL),

('app-john-2', 'opp-123456', 'Food Drive Coordinator', 'vol_123456', 'John Volunteer', 'john@example.com', 
 NULL, 'I would like to contribute to food security initiatives in our community.', 
 'submitted', NOW() - INTERVAL 1 DAY, 'pending', NULL, NULL),

-- Sarah's applications
('app-sarah-1', 'opp-123456', 'Food Drive Coordinator', 'vol_234567', 'Sarah Helper', 'sarah@example.com', 
 NULL, 'I have experience organizing food drives at my university and would love to help with this initiative.', 
 'accepted', NOW() - INTERVAL 2 DAY, 'present', 5, 8.5),

('app-sarah-2', 'opp-234567', 'Animal Shelter Helper', 'vol_234567', 'Sarah Helper', 'sarah@example.com', 
 NULL, 'As an animal lover, I would be thrilled to help care for animals at the shelter.', 
 'rejected', NOW() - INTERVAL 5 DAY, 'pending', NULL, NULL),

-- Mike's applications
('app-mike-1', 'opp-234567', 'Animal Shelter Helper', 'vol_345678', 'Mike Service', 'mike@example.com', 
 NULL, 'I have two dogs of my own and would love to help care for shelter animals.', 
 'accepted', NOW() - INTERVAL 1 DAY, 'present', 4, 6);

-- Output confirmation
SELECT 'Applications table created and sample data inserted successfully' AS 'Status'; 