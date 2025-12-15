# Tables Reference

Complete reference for all database tables with detailed column definitions, constraints, and indexes.

## Equity Module Tables

### users

**Purpose**: User accounts and authentication information.

**Location**: `equity/scripts/migrate-users-table.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Username for login |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| `password` | VARCHAR(255) | NULL | Bcrypt hashed password (NULL for OAuth) |
| `first_name` | VARCHAR(100) | NOT NULL | User's first name |
| `last_name` | VARCHAR(100) | NOT NULL | User's last name |
| `dob` | DATE | NOT NULL | Date of birth |
| `gender` | ENUM | NOT NULL | 'male', 'female', 'other', 'prefer_not_to_say' |
| `expertise_level` | ENUM | NOT NULL | '0-1', '1-5', '5-10', '10+' |
| `role` | ENUM | DEFAULT 'user' | 'user', 'admin' |
| `is_active` | BOOLEAN | DEFAULT FALSE | Account activation status |
| `email_verified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| `verification_token` | VARCHAR(255) | NULL | Email verification token |
| `verification_token_expires` | DATETIME | NULL | Token expiration time |
| `google_id` | VARCHAR(255) | UNIQUE, NULL | Google OAuth ID |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Update time |

**Indexes**:
- `PRIMARY KEY` on `id`
- `UNIQUE KEY` on `username`
- `UNIQUE KEY` on `email`
- `UNIQUE KEY` on `google_id`
- `idx_email` on `email`
- `idx_username` on `username`
- `idx_google_id` on `google_id`
- `idx_verification_token` on `verification_token`

### accounts

**Purpose**: Trading accounts (user-specific).

**Location**: `equity/scripts/migrate-accounts-user-id.sql`, `equity/scripts/migrate-kite-credentials-to-db.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique account identifier |
| `user_id` | INT | NOT NULL, FOREIGN KEY | Owner (references users.id) |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `broker_id` | VARCHAR(100) | NULL | Zerodha broker/client ID |
| `api_key` | VARCHAR(255) | NULL | Kite Connect API Key |
| `api_secret` | VARCHAR(255) | NULL | Kite Connect API Secret |
| `access_token` | TEXT | NULL | Kite access token |
| `access_token_expires_at` | TIMESTAMP | NULL | Token expiration |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Update time |
| `last_tradebook_sync` | TIMESTAMP | NULL | Last tradebook import |
| `last_ledger_sync` | TIMESTAMP | NULL | Last ledger import |
| `tradebook_records_count` | INT | DEFAULT 0 | Tradebook record count |
| `ledger_records_count` | INT | DEFAULT 0 | Ledger record count |

**Indexes**:
- `PRIMARY KEY` on `id`
- `idx_user_id` on `user_id`
- `idx_name` on `name`
- `idx_api_key` on `api_key`

**Foreign Keys**:
- `user_id` → `users.id` ON DELETE CASCADE

### trades

**Purpose**: Trade records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique trade identifier |
| `account_id` | INT | NOT NULL, FOREIGN KEY | Account (references accounts.id) |
| `symbol` | VARCHAR(50) | NOT NULL | Stock symbol |
| `isin` | VARCHAR(20) | NULL | ISIN code |
| `trade_date` | DATE | NOT NULL | Trade execution date |
| `exchange` | VARCHAR(20) | NULL | Exchange (NSE, BSE) |
| `segment` | VARCHAR(20) | NULL | Market segment |
| `series` | VARCHAR(10) | NULL | Series (EQ, BE) |
| `trade_type` | ENUM | NOT NULL | 'buy' or 'sell' |
| `auction` | BOOLEAN | DEFAULT FALSE | Auction trade flag |
| `quantity` | DECIMAL(15,4) | NOT NULL | Number of shares |
| `price` | DECIMAL(15,4) | NOT NULL | Execution price |
| `trade_id` | VARCHAR(100) | NULL | Broker trade ID |
| `order_id` | VARCHAR(100) | NULL | Broker order ID |
| `order_execution_time` | DATETIME | NULL | Execution timestamp |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `import_batch_id` | VARCHAR(50) | NULL | Import batch UUID |
| `import_date` | TIMESTAMP | NULL | Import timestamp |

**Indexes**:
- `PRIMARY KEY` on `id`
- `idx_account_symbol` on (`account_id`, `symbol`)
- `idx_trade_date` on `trade_date`
- `idx_symbol` on `symbol`
- `UNIQUE KEY unique_trade` on (`account_id`, `trade_id`)

**Foreign Keys**:
- `account_id` → `accounts.id` ON DELETE CASCADE

### ledger

**Purpose**: Ledger entries for cash flow tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique ledger identifier |
| `account_id` | INT | NOT NULL, FOREIGN KEY | Account (references accounts.id) |
| `particular` | TEXT | NULL | Transaction description |
| `posting_date` | DATE | NOT NULL | Transaction date |
| `cost_center` | VARCHAR(100) | NULL | Cost center |
| `voucher_type` | VARCHAR(50) | NULL | Voucher type |
| `debit` | DECIMAL(15,2) | DEFAULT 0 | Debit amount |
| `credit` | DECIMAL(15,2) | DEFAULT 0 | Credit amount |
| `net_balance` | DECIMAL(15,2) | NULL | Net balance |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `import_batch_id` | VARCHAR(50) | NULL | Import batch UUID |
| `import_date` | TIMESTAMP | NULL | Import timestamp |

**Indexes**:
- `PRIMARY KEY` on `id`
- `idx_account_date` on (`account_id`, `posting_date`)
- `idx_posting_date` on `posting_date`

**Foreign Keys**:
- `account_id` → `accounts.id` ON DELETE CASCADE

### import_conflicts

**Purpose**: Import conflict tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique conflict identifier |
| `account_id` | INT | NOT NULL, FOREIGN KEY | Account (references accounts.id) |
| `import_type` | ENUM | NOT NULL | 'tradebook' or 'ledger' |
| `conflict_type` | VARCHAR(50) | NOT NULL | Conflict type |
| `existing_data` | JSON | NOT NULL | Current database record |
| `new_data` | JSON | NOT NULL | Incoming CSV record |
| `conflict_field` | VARCHAR(255) | NULL | Differing field(s) |
| `status` | ENUM | DEFAULT 'pending' | Resolution status |
| `resolved_at` | TIMESTAMP | NULL | Resolution timestamp |
| `resolved_by` | VARCHAR(100) | NULL | Resolver identifier |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Indexes**:
- `PRIMARY KEY` on `id`
- `idx_status` on `status`
- `idx_account_type` on (`account_id`, `import_type`)

**Foreign Keys**:
- `account_id` → `accounts.id` ON DELETE CASCADE

**Status Values**:
- `pending` - Not resolved
- `resolved_keep_existing` - Keep database record
- `resolved_use_new` - Use new CSV record
- `resolved_manual` - Manually resolved
- `ignored` - Ignored conflict

## Balance Sheet Module Tables

### bs_categories

**Purpose**: Income/expense categories.

**Location**: `equity/scripts/setup-balancesheet.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique category identifier |
| `user_id` | INT | NOT NULL, FOREIGN KEY | Owner (references users.id) |
| `name` | VARCHAR(255) | NOT NULL | Category name |
| `type` | ENUM | NOT NULL | 'income' or 'expense' |
| `description` | TEXT | NULL | Category description |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Update time |

**Indexes**:
- `PRIMARY KEY` on `id`
- `idx_user_id` on `user_id`
- `idx_type` on `type`
- `UNIQUE KEY unique_user_category` on (`user_id`, `name`, `type`)

**Foreign Keys**:
- `user_id` → `users.id` ON DELETE CASCADE

### bs_banks

**Purpose**: Bank accounts.

**Location**: `equity/scripts/setup-balancesheet.sql`, `equity/scripts/migrate-banks-schema.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique bank identifier |
| `user_id` | INT | NOT NULL, FOREIGN KEY | Owner (references users.id) |
| `name` | VARCHAR(255) | NOT NULL | Bank name |
| `ifsc_code` | VARCHAR(11) | NULL | IFSC code |
| `account_name` | VARCHAR(255) | NULL | Account holder name |
| `account_number` | VARCHAR(50) | NULL | Account number |
| `balance` | DECIMAL(15,2) | DEFAULT 0.00 | Current balance |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Update time |

**Indexes**:
- `PRIMARY KEY` on `id`
- `idx_user_id` on `user_id`

**Foreign Keys**:
- `user_id` → `users.id` ON DELETE CASCADE

### bs_transactions

**Purpose**: Financial transactions.

**Location**: `equity/scripts/setup-balancesheet.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique transaction identifier |
| `user_id` | INT | NOT NULL, FOREIGN KEY | Owner (references users.id) |
| `category_id` | INT | NOT NULL, FOREIGN KEY | Category (references bs_categories.id) |
| `bank_id` | INT | NOT NULL, FOREIGN KEY | Bank (references bs_banks.id) |
| `type` | ENUM | NOT NULL | 'income' or 'expense' |
| `amount` | DECIMAL(15,2) | NOT NULL | Transaction amount |
| `transaction_date` | DATE | NOT NULL | Transaction date |
| `description` | TEXT | NULL | Transaction description |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Update time |

**Indexes**:
- `PRIMARY KEY` on `id`
- `idx_user_id` on `user_id`
- `idx_category_id` on `category_id`
- `idx_bank_id` on `bank_id`
- `idx_type` on `type`
- `idx_transaction_date` on `transaction_date`
- `idx_user_date` on (`user_id`, `transaction_date`)

**Foreign Keys**:
- `user_id` → `users.id` ON DELETE CASCADE
- `category_id` → `bs_categories.id` ON DELETE RESTRICT
- `bank_id` → `bs_banks.id` ON DELETE RESTRICT

### bs_recurring

**Purpose**: Recurring transaction templates.

**Location**: `equity/scripts/setup-balancesheet.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique recurring identifier |
| `user_id` | INT | NOT NULL, FOREIGN KEY | Owner (references users.id) |
| `category_id` | INT | NOT NULL, FOREIGN KEY | Category (references bs_categories.id) |
| `bank_id` | INT | NOT NULL, FOREIGN KEY | Bank (references bs_banks.id) |
| `type` | ENUM | NOT NULL | 'income' or 'expense' |
| `amount` | DECIMAL(15,2) | NOT NULL | Transaction amount |
| `description` | TEXT | NULL | Transaction description |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Update time |

**Indexes**:
- `PRIMARY KEY` on `id`
- `idx_user_id` on `user_id`
- `idx_category_id` on `category_id`
- `idx_bank_id` on `bank_id`
- `idx_type` on `type`

**Foreign Keys**:
- `user_id` → `users.id` ON DELETE CASCADE
- `category_id` → `bs_categories.id` ON DELETE RESTRICT
- `bank_id` → `bs_banks.id` ON DELETE RESTRICT

## Session Tables (Optional)

### sessions

**Purpose**: NextAuth.js sessions (OAuth).

**Location**: `equity/scripts/migrate-nextauth-sessions.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(255) | PRIMARY KEY | Session identifier |
| `user_id` | INT | NOT NULL, FOREIGN KEY | User (references users.id) |
| `session_token` | VARCHAR(255) | UNIQUE, NOT NULL | Session token |
| `expires` | DATETIME | NOT NULL | Expiration time |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Update time |

**Indexes**:
- `PRIMARY KEY` on `id`
- `UNIQUE KEY` on `session_token`
- `idx_session_token` on `session_token`
- `idx_user_id` on `user_id`
- `idx_expires` on `expires`

**Foreign Keys**:
- `user_id` → `users.id` ON DELETE CASCADE

### verification_tokens

**Purpose**: Email verification tokens.

**Location**: `equity/scripts/migrate-nextauth-sessions.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `identifier` | VARCHAR(255) | PRIMARY KEY | Email address |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | Verification token |
| `expires` | DATETIME | NOT NULL | Expiration time |

**Indexes**:
- `PRIMARY KEY` on (`identifier`, `token`)
- `idx_token` on `token`

