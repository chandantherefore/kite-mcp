# User-Specific Account Management

## Overview

All accounts in the system are user-specific. Each user can only see, create, modify, and delete their own accounts. This ensures complete data isolation and security between users.

## Database Schema

### Accounts Table

The `accounts` table includes a `user_id` foreign key that links each account to its owner:

```sql
CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    broker_id VARCHAR(100),
    ...
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
```

**Key Points**:
- Every account must belong to a user (`user_id` is NOT NULL)
- Foreign key constraint ensures referential integrity
- CASCADE delete: when a user is deleted, all their accounts are automatically deleted
- Index on `user_id` for efficient querying

## API Security

All API endpoints that interact with accounts, trades, ledger entries, or conflicts are user-scoped:

### Authentication Required

All endpoints require authentication via NextAuth session:

```typescript
const session = await getServerSession(authOptions);
if (!session || !session.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const userId = parseInt((session.user as any).id);
```

### Account Operations

- **GET /api/accounts**: Returns only accounts where `user_id = current_user_id`
- **POST /api/accounts**: Creates account with `user_id = current_user_id`
- **GET /api/accounts/[id]**: Verifies account belongs to user before returning
- **PUT /api/accounts/[id]**: Updates only if account belongs to user
- **DELETE /api/accounts/[id]**: Deletes only if account belongs to user

### Data Access Patterns

All data access follows the pattern of filtering by user through account ownership:

#### Trades
```sql
SELECT t.* FROM trades t
INNER JOIN accounts a ON t.account_id = a.id
WHERE a.user_id = ?
```

#### Ledger Entries
```sql
SELECT l.* FROM ledger l
INNER JOIN accounts a ON l.account_id = a.id
WHERE a.user_id = ?
```

#### Conflicts
```sql
SELECT ic.* FROM import_conflicts ic
INNER JOIN accounts a ON ic.account_id = a.id
WHERE a.user_id = ?
```

## Migration

If you have an existing database without `user_id` in the accounts table, run the migration script:

```bash
# Run the migration
mysql -u db -p oneapp < equity/scripts/migrate-accounts-user-id.sql
```

**Important**: Before running the migration:
1. Assign existing accounts to users, OR
2. Delete orphaned accounts that don't belong to any user

## Security Benefits

1. **Data Isolation**: Users cannot see or access other users' data
2. **Automatic Filtering**: All queries automatically filter by user_id
3. **Cascade Protection**: Deleting a user automatically cleans up their accounts and related data
4. **API-Level Security**: Every endpoint validates user ownership before operations

## Frontend Impact

The frontend automatically receives only user-specific data:
- Account lists show only the current user's accounts
- Tradebook shows only trades from user's accounts
- Ledger shows only entries from user's accounts
- Dashboard statistics are calculated only from user's accounts

No changes are required in the frontend code - the API automatically filters all data by user.

