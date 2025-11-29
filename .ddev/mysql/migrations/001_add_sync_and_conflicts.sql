-- Migration: Add Last Sync tracking and Conflicts table
-- Date: 2025-11-29

USE oneapp;

-- Add last sync columns to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS last_tradebook_sync TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS last_ledger_sync TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS tradebook_records_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ledger_records_count INT DEFAULT 0;

-- Create import_conflicts table
CREATE TABLE IF NOT EXISTS import_conflicts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    import_type ENUM('tradebook', 'ledger') NOT NULL,
    conflict_type VARCHAR(50) NOT NULL COMMENT 'duplicate_trade_id, duplicate_entry, etc.',
    existing_data JSON NOT NULL COMMENT 'Current database record',
    new_data JSON NOT NULL COMMENT 'Incoming CSV record',
    conflict_field VARCHAR(255) COMMENT 'Which field(s) differ',
    status ENUM('pending', 'resolved_keep_existing', 'resolved_use_new', 'resolved_manual', 'ignored') DEFAULT 'pending',
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_account_type (account_id, import_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add import_batch_id to trades and ledger for tracking
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(50) NULL COMMENT 'UUID for each import batch',
ADD COLUMN IF NOT EXISTS import_date TIMESTAMP NULL COMMENT 'When this record was imported';

ALTER TABLE ledger 
ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(50) NULL COMMENT 'UUID for each import batch',
ADD COLUMN IF NOT EXISTS import_date TIMESTAMP NULL COMMENT 'When this record was imported';

