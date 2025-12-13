# Data Modeling

## Table of Contents

1. [Database Overview](#database-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Table Definitions](#table-definitions)
4. [Data Models](#data-models)
5. [Relationships and Constraints](#relationships-and-constraints)
6. [Indexes and Performance](#indexes-and-performance)
7. [Database Design Decisions](#database-design-decisions)
8. [Gap Identification](#gap-identification)

## Database Overview

### Database System

- **Type**: MySQL 8.0+
- **Engine**: InnoDB
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Database Name**: `oneapp`

### Connection Configuration

**Location**: `equity/lib/db.ts`

```typescript
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'db',
  password: process.env.DATABASE_PASSWORD || 'db',
  database: process.env.DATABASE_NAME || 'oneapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
```

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │
│ username    │
│ email       │
│ password    │
│ first_name  │
│ last_name   │
│ dob         │
│ gender      │
│ expertise   │
│ role        │
│ is_active   │
│ email_verified│
│ google_id   │
└─────────────┘

┌─────────────┐
│  accounts   │
│─────────────│
│ id (PK)     │
│ name        │
│ broker_id   │
│ last_tradebook_sync│
│ last_ledger_sync│
│ tradebook_records_count│
│ ledger_records_count│
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────┐      ┌──────────────┐
│     trades      │      │    ledger     │
│─────────────────│      │──────────────│
│ id (PK)         │      │ id (PK)      │
│ account_id (FK) │      │ account_id (FK)│
│ symbol          │      │ particular    │
│ isin            │      │ posting_date  │
│ trade_date      │      │ cost_center   │
│ exchange        │      │ voucher_type  │
│ segment         │      │ debit         │
│ series          │      │ credit        │
│ trade_type      │      │ net_balance   │
│ auction         │      │ import_batch_id│
│ quantity        │      │ import_date   │
│ price           │      └──────────────┘
│ trade_id        │
│ order_id        │
│ order_execution_time│
│ import_batch_id │
│ import_date     │
└─────────────────┘

┌──────────────────┐
│ import_conflicts │
│──────────────────│
│ id (PK)          │
│ account_id (FK)  │
│ import_type      │
│ conflict_type    │
│ existing_data    │
│ new_data         │
│ conflict_field   │
│ status           │
│ resolved_at      │
│ resolved_by      │
└──────────────────┘
```

## Table Definitions

### users

**Purpose**: Stores user accounts and authentication information.

**Location**: `equity/scripts/migrate-users-table.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Username for login |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| `password` | VARCHAR(255) | NULL | Bcrypt hashed password (NULL for OAuth users) |
| `first_name` | VARCHAR(100) | NOT NULL | User's first name |
| `last_name` | VARCHAR(100) | NOT NULL | User's last name |
| `dob` | DATE | NOT NULL | Date of birth |
| `gender` | ENUM | NOT NULL | Gender: 'male', 'female', 'other', 'prefer_not_to_say' |
| `expertise_level` | ENUM | NOT NULL | Market expertise: '0-1', '1-5', '5-10', '10+' |
| `role` | ENUM | DEFAULT 'user' | User role: 'user', 'admin' |
| `is_active` | BOOLEAN | DEFAULT FALSE | Account activation status |
| `email_verified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| `verification_token` | VARCHAR(255) | NULL | Email verification token |
| `verification_token_expires` | DATETIME | NULL | Token expiration time |
| `google_id` | VARCHAR(255) | UNIQUE, NULL | Google OAuth ID |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Indexes**:
- `idx_email` on `email`
- `idx_username` on `username`
- `idx_google_id` on `google_id`
- `idx_verification_token` on `verification_token`

### accounts

**Purpose**: Stores trading accounts that can be linked to Zerodha broker accounts. **Each account is user-specific and isolated.**

**Location**: `.ddev/mysql/init.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique account identifier |
| `user_id` | INT | NOT NULL, FOREIGN KEY | Owner of the account (references users.id) |
| `name` | VARCHAR(255) | NOT NULL | Display name for the account |
| `broker_id` | VARCHAR(100) | NULL | Zerodha broker/client ID |
| `api_key` | VARCHAR(255) | NULL | Kite Connect API Key (for live data) |
| `api_secret` | VARCHAR(255) | NULL | Kite Connect API Secret (for live data) |
| `access_token` | TEXT | NULL | Kite Connect access token (after authentication) |
| `access_token_expires_at` | TIMESTAMP | NULL | Access token expiration timestamp |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update time |
| `last_tradebook_sync` | TIMESTAMP | NULL | Last tradebook import timestamp |
| `last_ledger_sync` | TIMESTAMP | NULL | Last ledger import timestamp |
| `tradebook_records_count` | INT | DEFAULT 0 | Total tradebook records imported |
| `ledger_records_count` | INT | DEFAULT 0 | Total ledger records imported |

**Indexes**:
- `idx_name` on `name`
- `idx_user_id` on `user_id`
- `idx_api_key` on `api_key`

**Security**: All account operations are user-scoped. Users can only access, modify, or delete their own accounts. The foreign key constraint ensures accounts are automatically deleted when a user is deleted (CASCADE).

**Migration**: Additional columns added in `.ddev/mysql/migrations/001_add_sync_and_conflicts.sql`

### trades

**Purpose**: Stores individual trade records imported from CSV or entered manually.

**Location**: `.ddev/mysql/init.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique trade identifier |
| `account_id` | INT | NOT NULL, FOREIGN KEY | Reference to accounts table |
| `symbol` | VARCHAR(50) | NOT NULL | Stock symbol (e.g., "INFY") |
| `isin` | VARCHAR(20) | NULL | ISIN code |
| `trade_date` | DATE | NOT NULL | Date of trade execution |
| `exchange` | VARCHAR(20) | NULL | Exchange (NSE, BSE, etc.) |
| `segment` | VARCHAR(20) | NULL | Market segment |
| `series` | VARCHAR(10) | NULL | Series (EQ, BE, etc.) |
| `trade_type` | ENUM | NOT NULL | 'buy' or 'sell' |
| `auction` | BOOLEAN | DEFAULT FALSE | Whether trade was in auction |
| `quantity` | DECIMAL(15,4) | NOT NULL | Number of shares |
| `price` | DECIMAL(15,4) | NOT NULL | Execution price per share |
| `trade_id` | VARCHAR(100) | NULL | Unique trade ID from broker |
| `order_id` | VARCHAR(100) | NULL | Order ID from broker |
| `order_execution_time` | DATETIME | NULL | Order execution timestamp |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `import_batch_id` | VARCHAR(50) | NULL | UUID for import batch tracking |
| `import_date` | TIMESTAMP | NULL | When record was imported |

**Indexes**:
- `idx_account_symbol` on (`account_id`, `symbol`)
- `idx_trade_date` on `trade_date`
- `idx_symbol` on `symbol`
- `UNIQUE KEY unique_trade` on (`account_id`, `trade_id`)

**Foreign Keys**:
- `account_id` → `accounts(id)` ON DELETE CASCADE

**Migration**: `import_batch_id` and `import_date` added in `.ddev/mysql/migrations/001_add_sync_and_conflicts.sql`

### ledger

**Purpose**: Stores ledger/transaction entries for cash flow tracking and XIRR calculations.

**Location**: `.ddev/mysql/init.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique ledger entry identifier |
| `account_id` | INT | NOT NULL, FOREIGN KEY | Reference to accounts table |
| `particular` | TEXT | NULL | Transaction description |
| `posting_date` | DATE | NOT NULL | Date of transaction |
| `cost_center` | VARCHAR(100) | NULL | Cost center classification |
| `voucher_type` | VARCHAR(50) | NULL | Type of voucher |
| `debit` | DECIMAL(15,2) | DEFAULT 0 | Debit amount |
| `credit` | DECIMAL(15,2) | DEFAULT 0 | Credit amount |
| `net_balance` | DECIMAL(15,2) | NULL | Net balance after transaction |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `import_batch_id` | VARCHAR(50) | NULL | UUID for import batch tracking |
| `import_date` | TIMESTAMP | NULL | When record was imported |

**Indexes**:
- `idx_account_date` on (`account_id`, `posting_date`)
- `idx_posting_date` on `posting_date`

**Foreign Keys**:
- `account_id` → `accounts(id)` ON DELETE CASCADE

**Migration**: `import_batch_id` and `import_date` added in `.ddev/mysql/migrations/001_add_sync_and_conflicts.sql`

### import_conflicts

**Purpose**: Tracks conflicts detected during CSV imports (duplicate records, data mismatches).

**Location**: `.ddev/mysql/migrations/001_add_sync_and_conflicts.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique conflict identifier |
| `account_id` | INT | NOT NULL, FOREIGN KEY | Reference to accounts table |
| `import_type` | ENUM | NOT NULL | 'tradebook' or 'ledger' |
| `conflict_type` | VARCHAR(50) | NOT NULL | Type of conflict (e.g., 'duplicate_trade_id') |
| `existing_data` | JSON | NOT NULL | Current database record |
| `new_data` | JSON | NOT NULL | Incoming CSV record |
| `conflict_field` | VARCHAR(255) | NULL | Field(s) that differ |
| `status` | ENUM | DEFAULT 'pending' | Resolution status: 'pending', 'resolved_keep_existing', 'resolved_use_new', 'resolved_manual', 'ignored' |
| `resolved_at` | TIMESTAMP | NULL | When conflict was resolved |
| `resolved_by` | VARCHAR(100) | NULL | Who resolved the conflict |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Conflict creation time |

**Indexes**:
- `idx_status` on `status`
- `idx_account_type` on (`account_id`, `import_type`)

**Foreign Keys**:
- `account_id` → `accounts(id)` ON DELETE CASCADE

## Data Models

### TypeScript Interfaces

**Location**: `equity/lib/db.ts`

#### User

```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  password: string | null;
  first_name: string;
  last_name: string;
  dob: Date;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  expertise_level: '0-1' | '1-5' | '5-10' | '10+';
  role: 'user' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: Date | null;
  google_id: string | null;
  created_at: Date;
  updated_at: Date;
}
```

#### Account

```typescript
export interface Account {
  id: number;
  name: string;
  broker_id: string | null;
  created_at: Date;
  updated_at: Date;
  last_tradebook_sync: Date | null;
  last_ledger_sync: Date | null;
  tradebook_records_count: number;
  ledger_records_count: number;
}
```

#### Trade

```typescript
export interface Trade {
  id: number;
  account_id: number;
  symbol: string;
  isin: string | null;
  trade_date: Date;
  exchange: string | null;
  segment: string | null;
  series: string | null;
  trade_type: 'buy' | 'sell';
  auction: boolean;
  quantity: number;
  price: number;
  trade_id: string | null;
  order_id: string | null;
  order_execution_time: Date | null;
  created_at: Date;
  import_batch_id: string | null;
  import_date: Date | null;
}
```

#### Ledger

```typescript
export interface Ledger {
  id: number;
  account_id: number;
  particular: string | null;
  posting_date: Date;
  cost_center: string | null;
  voucher_type: string | null;
  debit: number;
  credit: number;
  net_balance: number | null;
  created_at: Date;
  import_batch_id: string | null;
  import_date: Date | null;
}
```

#### ImportConflict

```typescript
export interface ImportConflict {
  id: number;
  account_id: number;
  import_type: 'tradebook' | 'ledger';
  conflict_type: string;
  existing_data: any;
  new_data: any;
  conflict_field: string | null;
  status: 'pending' | 'resolved_keep_existing' | 'resolved_use_new' | 'resolved_manual' | 'ignored';
  resolved_at: Date | null;
  resolved_by: string | null;
  created_at: Date;
}
```

## Relationships and Constraints

### Primary Relationships

1. **accounts → trades** (1:N)
   - One account can have many trades
   - Foreign key: `trades.account_id` → `accounts.id`
   - Cascade delete: Deleting an account deletes all its trades

2. **accounts → ledger** (1:N)
   - One account can have many ledger entries
   - Foreign key: `ledger.account_id` → `accounts.id`
   - Cascade delete: Deleting an account deletes all its ledger entries

3. **accounts → import_conflicts** (1:N)
   - One account can have many import conflicts
   - Foreign key: `import_conflicts.account_id` → `accounts.id`
   - Cascade delete: Deleting an account deletes all its conflicts

### Data Integrity Constraints

1. **Unique Constraints**:
   - `users.username`: Unique username
   - `users.email`: Unique email
   - `users.google_id`: Unique Google OAuth ID
   - `trades(account_id, trade_id)`: Unique trade per account

2. **Foreign Key Constraints**:
   - All foreign keys use `ON DELETE CASCADE` to maintain referential integrity

3. **Check Constraints** (via application logic):
   - `trade_type` must be 'buy' or 'sell'
   - `quantity` and `price` must be positive
   - `email` must be valid format
   - `password` must be hashed (bcrypt)

## Indexes and Performance

### Index Strategy

1. **Primary Keys**: All tables have auto-incrementing integer primary keys
2. **Foreign Keys**: Indexed automatically by MySQL
3. **Query Optimization**: Indexes on frequently queried columns

### Key Indexes

#### users
- `idx_email`: Fast email lookups for authentication
- `idx_username`: Fast username lookups
- `idx_google_id`: Fast OAuth lookups
- `idx_verification_token`: Fast token validation

#### trades
- `idx_account_symbol`: Optimizes queries filtering by account and symbol
- `idx_trade_date`: Optimizes date range queries
- `idx_symbol`: Optimizes symbol-based queries
- `unique_trade`: Prevents duplicate trades per account

#### ledger
- `idx_account_date`: Optimizes account-specific date range queries
- `idx_posting_date`: Optimizes date-based queries

#### import_conflicts
- `idx_status`: Optimizes filtering by resolution status
- `idx_account_type`: Optimizes account and type filtering

### Performance Considerations

1. **Decimal Precision**: 
   - Trades: `DECIMAL(15,4)` for quantity and price (supports fractional shares)
   - Ledger: `DECIMAL(15,2)` for amounts (standard currency precision)

2. **Text Fields**:
   - `ledger.particular`: TEXT type for long descriptions
   - Other fields use VARCHAR with appropriate limits

3. **JSON Fields**:
   - `import_conflicts.existing_data` and `new_data`: JSON type for flexible conflict storage

## Database Design Decisions

### 1. Separate Accounts Table

**Decision**: Accounts are stored separately from users, allowing multiple accounts per user (future enhancement).

**Rationale**: 
- Supports multi-account scenarios
- Allows account-level data isolation
- Enables account sharing (future feature)

### 2. Import Batch Tracking

**Decision**: Added `import_batch_id` and `import_date` to trades and ledger tables.

**Rationale**:
- Enables tracking of import operations
- Supports rollback of specific imports
- Helps identify data sources

### 3. Conflict Resolution System

**Decision**: Separate `import_conflicts` table for tracking import conflicts.

**Rationale**:
- Prevents data loss during imports
- Provides audit trail of conflicts
- Enables manual resolution workflow

### 4. JSON Storage for Conflicts

**Decision**: Store conflict data as JSON in `import_conflicts` table.

**Rationale**:
- Flexible schema for different conflict types
- Preserves complete record data
- Easy to extend for new conflict types

### 5. Soft Delete Strategy

**Decision**: No soft delete columns; use CASCADE DELETE.

**Rationale**:
- Simpler data model
- Prevents orphaned records
- Clear data lifecycle

<!-- TODO: [GAP] Consider if soft deletes are needed for audit purposes -->

### 6. Email Verification System

**Decision**: Separate `email_verified` flag and token-based verification.

**Rationale**:
- Security best practice
- Prevents fake accounts
- Supports email change workflow

### 7. OAuth Integration

**Decision**: Store `google_id` separately, allow NULL password.

**Rationale**:
- Supports multiple authentication methods
- OAuth users don't need passwords
- Easy to add more OAuth providers

## Gap Identification

The following areas require additional data modeling documentation:

1. **Data Archival Strategy**: Long-term data archival and retention policies
2. **Backup and Recovery**: Database backup strategies and recovery procedures
3. **Data Migration**: Migration strategies for schema changes
4. **Partitioning Strategy**: Table partitioning for large datasets
5. **Replication**: Database replication setup (if applicable)
6. **Query Optimization**: Additional query optimization strategies
7. **Data Validation Rules**: Comprehensive validation rules documentation
8. **Audit Logging**: Audit trail requirements and implementation
9. **Data Privacy**: GDPR/compliance considerations for user data
10. **Performance Benchmarks**: Expected query performance and optimization targets

See also: [08-Special-Considerations.md](08-Special-Considerations.md) for additional considerations.

