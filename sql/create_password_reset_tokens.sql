-- Create password_reset_tokens table
USE volunteer_bazaar;

-- Create the password_reset_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    token VARCHAR(100) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (token),
    INDEX (user_id)
);

-- Add index on expires_at for faster token validation queries
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Add comment to the table
ALTER TABLE password_reset_tokens COMMENT = 'Stores password reset tokens for users'; 