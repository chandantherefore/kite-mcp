-- Database initialization script for oneapp
CREATE DATABASE IF NOT EXISTS oneapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions to db user
GRANT ALL PRIVILEGES ON oneapp.* TO 'db'@'%';
FLUSH PRIVILEGES;

USE oneapp;

-- Accounts table (user-specific with Kite API credentials)
CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    broker_id VARCHAR(100),
    api_key VARCHAR(255) NULL,
    api_secret VARCHAR(255) NULL,
    access_token TEXT NULL,
    access_token_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_tradebook_sync TIMESTAMP NULL,
    last_ledger_sync TIMESTAMP NULL,
    tradebook_records_count INT DEFAULT 0,
    ledger_records_count INT DEFAULT 0,
    INDEX idx_name (name),
    INDEX idx_user_id (user_id),
    INDEX idx_api_key (api_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    isin VARCHAR(20),
    trade_date DATE NOT NULL,
    exchange VARCHAR(20),
    segment VARCHAR(20),
    series VARCHAR(10),
    trade_type ENUM('buy', 'sell') NOT NULL,
    auction BOOLEAN DEFAULT FALSE,
    quantity DECIMAL(15, 4) NOT NULL,
    price DECIMAL(15, 4) NOT NULL,
    trade_id VARCHAR(100),
    order_id VARCHAR(100),
    order_execution_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX idx_account_symbol (account_id, symbol),
    INDEX idx_trade_date (trade_date),
    INDEX idx_symbol (symbol),
    UNIQUE KEY unique_trade (account_id, trade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ledger table
CREATE TABLE IF NOT EXISTS ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    particular TEXT,
    posting_date DATE NOT NULL,
    cost_center VARCHAR(100),
    voucher_type VARCHAR(50),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    net_balance DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX idx_account_date (account_id, posting_date),
    INDEX idx_posting_date (posting_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

