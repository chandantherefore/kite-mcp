-- Migration: Update Banks Table Schema
-- Description: Remove owner field, add IFSC Code, Account Name, Account Number
-- Created: 2025-01-XX

ALTER TABLE bs_banks 
  DROP COLUMN IF EXISTS owner,
  ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(11) NULL,
  ADD COLUMN IF NOT EXISTS account_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(50) NULL;



