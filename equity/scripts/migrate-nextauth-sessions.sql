-- Migration script for NextAuth.js database session storage
-- This script creates the necessary tables for storing sessions in the database
-- Run this script on your MySQL database

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_token (session_token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create verification_tokens table (for email verification, password reset, etc.)
-- Note: This table might already exist from your email verification setup
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires DATETIME NOT NULL,
  PRIMARY KEY (identifier, token),
  INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better performance
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_email (email);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_google_id (google_id);

-- Optional: Clean up expired sessions periodically
-- You can set up a scheduled event to run this query daily
DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_expired_sessions
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DELETE FROM sessions WHERE expires < NOW();
  DELETE FROM verification_tokens WHERE expires < NOW();
END$$
DELIMITER ;

-- Verify tables were created
SHOW TABLES LIKE '%session%';
SHOW TABLES LIKE '%verification_tokens%';

SELECT 'Migration completed successfully!' as status;

