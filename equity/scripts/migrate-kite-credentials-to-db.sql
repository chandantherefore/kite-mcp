-- Migration: Move Kite API credentials from .env to database
-- This migration adds api_key and api_secret columns to accounts table
-- and migrates from environment variable-based to database-based credential management

USE oneapp;

-- Add Kite API credential columns to accounts table
ALTER TABLE accounts 
ADD COLUMN api_key VARCHAR(255) NULL AFTER broker_id,
ADD COLUMN api_secret VARCHAR(255) NULL AFTER api_key,
ADD COLUMN access_token TEXT NULL AFTER api_secret,
ADD COLUMN access_token_expires_at TIMESTAMP NULL AFTER access_token,
ADD INDEX idx_api_key (api_key);

-- Note: Existing accounts will have NULL values for api_key and api_secret
-- Users will need to add these through the Accounts management page

