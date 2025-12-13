-- Migration: Add user_id to accounts table for user-specific account management
-- Run this migration to make accounts user-specific

USE oneapp;

-- Add user_id column to accounts table
ALTER TABLE accounts 
ADD COLUMN user_id INT NOT NULL AFTER id,
ADD INDEX idx_user_id (user_id);

-- Add foreign key constraint
ALTER TABLE accounts
ADD CONSTRAINT fk_accounts_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Note: For existing accounts, you may need to assign them to a default user
-- or delete them. Uncomment and modify the following if needed:
-- UPDATE accounts SET user_id = 1 WHERE user_id IS NULL OR user_id = 0;
-- Or delete orphaned accounts:
-- DELETE FROM accounts WHERE user_id NOT IN (SELECT id FROM users);

