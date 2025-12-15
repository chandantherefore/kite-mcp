# Database Schema

## Overview

**Database System**: MySQL 8.0+  
**Engine**: InnoDB  
**Character Set**: utf8mb4  
**Collation**: utf8mb4_unicode_ci  
**Database Name**: `oneapp`

## Connection Configuration

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

## Table Categories

### Equity Module Tables

1. `users` - User accounts and authentication
2. `accounts` - Trading accounts (user-specific)
3. `trades` - Trade records
4. `ledger` - Ledger entries
5. `import_conflicts` - Import conflict tracking

### Balance Sheet Module Tables

1. `bs_categories` - Income/expense categories
2. `bs_banks` - Bank accounts
3. `bs_transactions` - Financial transactions
4. `bs_recurring` - Recurring transaction templates

### Session Tables (Optional)

1. `sessions` - NextAuth.js sessions (if long sessions enabled)
2. `verification_tokens` - Email verification tokens

## Table Summary

| Table | Purpose | User-Scoped | Foreign Keys |
|-------|---------|------------|--------------|
| `users` | User accounts | N/A | - |
| `accounts` | Trading accounts | Yes (user_id) | users.id |
| `trades` | Trade records | Yes (via accounts) | accounts.id |
| `ledger` | Ledger entries | Yes (via accounts) | accounts.id |
| `import_conflicts` | Import conflicts | Yes (via accounts) | accounts.id |
| `bs_categories` | Categories | Yes (user_id) | users.id |
| `bs_banks` | Bank accounts | Yes (user_id) | users.id |
| `bs_transactions` | Transactions | Yes (user_id) | users.id, bs_categories.id, bs_banks.id |
| `bs_recurring` | Recurring transactions | Yes (user_id) | users.id, bs_categories.id, bs_banks.id |
| `sessions` | User sessions | Yes (user_id) | users.id |
| `verification_tokens` | Email tokens | No | - |

## Migration Scripts

**Location**: `equity/scripts/`

**Execution Order**:
1. `migrate-users-table.sql` - Creates users table
2. `migrate-accounts-user-id.sql` - Adds user_id to accounts
3. `migrate-kite-credentials-to-db.sql` - Adds API credential columns
4. `setup-balancesheet.sql` - Creates balance sheet tables
5. `migrate-banks-schema.sql` - Updates banks table schema
6. `migrate-nextauth-sessions.sql` - Creates session tables (optional)

## Indexes

All tables have appropriate indexes for:
- Primary keys (automatic)
- Foreign keys
- User-scoped queries (`user_id`, `account_id`)
- Common query patterns (dates, symbols, etc.)

See `Documentation/3-Data-Module/Tables-Reference.md` for detailed index information.

## Constraints

### Foreign Key Constraints

- `accounts.user_id` → `users.id` (ON DELETE CASCADE)
- `trades.account_id` → `accounts.id` (ON DELETE CASCADE)
- `ledger.account_id` → `accounts.id` (ON DELETE CASCADE)
- `import_conflicts.account_id` → `accounts.id` (ON DELETE CASCADE)
- `bs_categories.user_id` → `users.id` (ON DELETE CASCADE)
- `bs_banks.user_id` → `users.id` (ON DELETE CASCADE)
- `bs_transactions.user_id` → `users.id` (ON DELETE CASCADE)
- `bs_transactions.category_id` → `bs_categories.id` (ON DELETE RESTRICT)
- `bs_transactions.bank_id` → `bs_banks.id` (ON DELETE RESTRICT)
- `bs_recurring.user_id` → `users.id` (ON DELETE CASCADE)
- `bs_recurring.category_id` → `bs_categories.id` (ON DELETE RESTRICT)
- `bs_recurring.bank_id` → `bs_banks.id` (ON DELETE RESTRICT)
- `sessions.user_id` → `users.id` (ON DELETE CASCADE)

### Unique Constraints

- `users.username` - Unique
- `users.email` - Unique
- `users.google_id` - Unique (nullable)
- `bs_categories(user_id, name, type)` - Unique combination

## Data Isolation

**All data is user-scoped**:
- Direct user ownership: `user_id` column
- Indirect ownership: Via `account_id` → `accounts.user_id`

**Query Pattern**:
```sql
SELECT t.* FROM trades t
INNER JOIN accounts a ON t.account_id = a.id
WHERE a.user_id = ?
```

This ensures users can only access their own data.

