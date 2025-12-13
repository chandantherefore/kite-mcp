# Change Request: User-Specific Account Management

## Overview

This change request adds user-specific account management to the system. After this change, each user can only see and manage their own accounts.

## Prerequisites

1. Ensure you have a backup of your database
2. All users must be created before running this migration
3. Decide how to handle existing accounts (assign to users or delete)

## Migration Steps

### Step 1: Run the Database Migration

```bash
# Connect to your database
mysql -u db -p oneapp < equity/scripts/migrate-accounts-user-id.sql
```

Or manually run the SQL:

```sql
USE oneapp;

-- Add user_id column to accounts table
ALTER TABLE accounts 
ADD COLUMN user_id INT NOT NULL AFTER id,
ADD INDEX idx_user_id (user_id);

-- Add foreign key constraint
ALTER TABLE accounts
ADD CONSTRAINT fk_accounts_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### Step 2: Handle Existing Accounts

**Option A: Assign existing accounts to a default user**

```sql
-- Replace 1 with the actual user ID you want to assign accounts to
UPDATE accounts SET user_id = 1 WHERE user_id IS NULL OR user_id = 0;
```

**Option B: Delete orphaned accounts**

```sql
-- Delete accounts that don't belong to any user
DELETE FROM accounts WHERE user_id NOT IN (SELECT id FROM users);
```

**Option C: Assign accounts to specific users**

```sql
-- Example: Assign account ID 1 to user ID 2
UPDATE accounts SET user_id = 2 WHERE id = 1;
```

### Step 3: Verify Migration

```sql
-- Check that all accounts have a valid user_id
SELECT COUNT(*) FROM accounts WHERE user_id IS NULL;
-- Should return 0

-- Check foreign key constraint
SELECT COUNT(*) FROM accounts a 
LEFT JOIN users u ON a.user_id = u.id 
WHERE u.id IS NULL;
-- Should return 0
```

## What Changed

### Database Schema
- Added `user_id` column to `accounts` table
- Added foreign key constraint linking accounts to users
- Added index on `user_id` for performance

### API Changes
- All account endpoints now require authentication
- All account queries filter by `user_id`
- All trades, ledger, and conflict queries filter by user through account ownership

### Code Changes
- Updated `Account` interface to include `user_id`
- Updated all database query functions to accept `userId` parameter
- Updated all API endpoints to get current user from session
- All queries now use JOINs to ensure user ownership

## Testing

After migration, verify:

1. **Login** as a user
2. **Create an account** - should succeed
3. **List accounts** - should only show your accounts
4. **Try to access another user's account** - should return 404
5. **Import tradebook/ledger** - should only work with your accounts
6. **View tradebook/ledger** - should only show your data

## Rollback (if needed)

If you need to rollback:

```sql
-- Remove foreign key
ALTER TABLE accounts DROP FOREIGN KEY fk_accounts_user_id;

-- Remove index
ALTER TABLE accounts DROP INDEX idx_user_id;

-- Remove column
ALTER TABLE accounts DROP COLUMN user_id;
```

**Warning**: Rolling back will lose the user_id data. Only do this if absolutely necessary.

## Notes

- The frontend code doesn't need changes - it automatically receives filtered data
- All existing functionality continues to work, but now user-scoped
- Users can still have multiple accounts, but only see their own
- Admin users can manage other users but still only see their own accounts (unless admin endpoints are added)

