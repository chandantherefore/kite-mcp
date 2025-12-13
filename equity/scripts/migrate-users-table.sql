-- Migration: Create Users Table
-- Description: Creates the users table for authentication system
-- Created: 2025-12-01

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NULL, -- NULL for Google OAuth users
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
  expertise_level ENUM('0-1', '1-5', '5-10', '10+') NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255) NULL,
  verification_token_expires DATETIME NULL,
  google_id VARCHAR(255) NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_google_id (google_id),
  INDEX idx_verification_token (verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a default admin user (password: admin123)
-- Password hash generated with bcryptjs for 'admin123'
INSERT INTO users (
  username, 
  email, 
  password, 
  first_name, 
  last_name, 
  dob, 
  gender, 
  expertise_level, 
  role, 
  is_active, 
  email_verified
) VALUES (
  'admin',
  'admin@kite.local',
  '$2a$10$rZkVvxX.wKJZN9L5p3qx5eJ3GYf4QVHf8H3ZQpHfVq4Kq2KgHqF2i', -- admin123
  'Admin',
  'User',
  '1990-01-01',
  'prefer_not_to_say',
  '10+',
  'admin',
  TRUE,
  TRUE
) ON DUPLICATE KEY UPDATE email = email; -- Avoid error if already exists

