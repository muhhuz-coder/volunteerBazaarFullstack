-- Insert sample conversations and messages

-- Use the volunteer_bazaar database
USE volunteer_bazaar;

-- Insert sample conversations between organizations and volunteers
INSERT IGNORE INTO conversations (id, organization_id, volunteer_id, opportunity_id, opportunity_title, organization_name, volunteer_name, created_at, updated_at)
VALUES 
('convo-123456', 'org_123456', 'vol_123456', 'opp-345678', 'Disaster Relief Volunteer', 'Red Cross Chapter', 'John Volunteer', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 HOUR),
('convo-234567', 'org_234567', 'vol_234567', 'opp-123456', 'Food Drive Coordinator', 'Food Bank Network', 'Sarah Helper', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 3 HOUR),
('convo-345678', 'org_345678', 'vol_345678', 'opp-234567', 'Animal Shelter Helper', 'Animal Rescue Center', 'Mike Service', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 30 MINUTE);

-- Insert sample messages for the first conversation
INSERT IGNORE INTO messages (id, conversation_id, sender_id, text, timestamp, is_read)
VALUES
('msg-100001', 'convo-123456', 'org_123456', 'Hello John, thank you for your interest in our Disaster Relief Volunteer opportunity!', NOW() - INTERVAL 3 DAY, 1),
('msg-100002', 'convo-123456', 'vol_123456', 'Hi there! I\'m excited to help out with disaster relief efforts.', NOW() - INTERVAL 2 DAY + INTERVAL 12 HOUR, 1),
('msg-100003', 'convo-123456', 'org_123456', 'Great! We have an orientation session this weekend. Would you be able to attend?', NOW() - INTERVAL 2 DAY, 1),
('msg-100004', 'convo-123456', 'vol_123456', 'Yes, I can make it. What time and where?', NOW() - INTERVAL 1 DAY + INTERVAL 12 HOUR, 1),
('msg-100005', 'convo-123456', 'org_123456', 'The orientation is at our main office at 10 AM on Saturday. Looking forward to meeting you!', NOW() - INTERVAL 1 HOUR, 0);

-- Insert sample messages for the second conversation
INSERT IGNORE INTO messages (id, conversation_id, sender_id, text, timestamp, is_read)
VALUES
('msg-200001', 'convo-234567', 'org_234567', 'Hi Sarah, thanks for applying to our Food Drive Coordinator position!', NOW() - INTERVAL 2 DAY, 1),
('msg-200002', 'convo-234567', 'vol_234567', 'Hello! I\'m very interested in helping with food security initiatives.', NOW() - INTERVAL 1 DAY + INTERVAL 18 HOUR, 1),
('msg-200003', 'convo-234567', 'org_234567', 'That\'s wonderful to hear. Do you have any previous experience with food drives?', NOW() - INTERVAL 1 DAY + INTERVAL 12 HOUR, 1),
('msg-200004', 'convo-234567', 'vol_234567', 'Yes, I organized two food drives at my university last year. We collected over 500 pounds of food.', NOW() - INTERVAL 1 DAY, 1),
('msg-200005', 'convo-234567', 'org_234567', 'Impressive! We\'d love to have you on board. Can you come in for an interview next week?', NOW() - INTERVAL 3 HOUR, 0);

-- Insert sample messages for the third conversation
INSERT IGNORE INTO messages (id, conversation_id, sender_id, text, timestamp, is_read)
VALUES
('msg-300001', 'convo-345678', 'org_345678', 'Hello Mike, thank you for your interest in helping at our animal shelter!', NOW() - INTERVAL 1 DAY, 1),
('msg-300002', 'convo-345678', 'vol_345678', 'Hi there! I love animals and would be happy to help out.', NOW() - INTERVAL 20 HOUR, 1),
('msg-300003', 'convo-345678', 'org_345678', 'Wonderful! We need help with dog walking and socialization. Are you comfortable with dogs?', NOW() - INTERVAL 15 HOUR, 1),
('msg-300004', 'convo-345678', 'vol_345678', 'Absolutely! I have two dogs of my own and have volunteered at shelters before.', NOW() - INTERVAL 10 HOUR, 1),
('msg-300005', 'convo-345678', 'org_345678', 'Perfect! Can you start this weekend? We have orientation at 9 AM on Saturday.', NOW() - INTERVAL 30 MINUTE, 0);

-- Output confirmation
SELECT 'Sample conversations and messages inserted successfully' AS 'Status'; 