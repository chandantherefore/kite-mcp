# Change Request: Database-Based Kite Authentication

## Overview

This change request migrates Kite Connect API credential management from environment variables (`.env.local`) to a database-based CMS (Content Management System). Users can now manage their Kite API credentials directly through the Accounts management page in the web application.

## Motivation

- **User-Friendly**: Users can add and manage Kite credentials through the UI without needing to edit environment files
- **Multi-User Support**: Each user can manage their own credentials independently
- **Scalability**: No need to restart the server when adding new accounts
- **Security**: Credentials are stored in the database with proper user isolation

## Changes Made

### Database Schema

**Added columns to `accounts` table:**
- `api_key` (VARCHAR(255), NULL): Kite Connect API Key
- `api_secret` (VARCHAR(255), NULL): Kite Connect API Secret
- `access_token` (TEXT, NULL): Kite Connect access token (after authentication)
- `access_token_expires_at` (TIMESTAMP, NULL): Token expiration timestamp

**Migration Script**: `equity/scripts/migrate-kite-credentials-to-db.sql`

### Code Changes

#### 1. Database Layer (`equity/lib/db.ts`)
- Updated `Account` interface to include Kite credential fields
- Added `updateAccountAccessToken()` method
- Added `clearAccountAccessToken()` method
- Updated `createAccount()` and `updateAccount()` to accept `api_key` and `api_secret`

#### 2. Kite Service (`equity/lib/kite-service.ts`)
- **Removed**: Environment variable-based account loading (`loadAccountsConfig()`)
- **Added**: Database-based credential loading (`loadSessionFromDB()`)
- **Changed**: Session management now uses account IDs (numbers) instead of client IDs (strings)
- **Updated**: All tool handlers now require `account_id` and `user_id` parameters
- **Changed**: Access tokens are now saved to the database instead of file system

#### 3. API Endpoints

**`/api/accounts` (GET, POST)**
- Updated to handle `api_key` and `api_secret` in account creation/updates

**`/api/accounts/[id]` (GET, PUT, DELETE)**
- Updated to handle `api_key` and `api_secret` in account updates

**`/api/kite/auth` (POST)**
- Updated to use `account_id` and `user_id` from session
- Removed dependency on environment variables

**`/api/kite/execute` (POST)**
- Updated to automatically inject `user_id` from session
- All tools now require `account_id` parameter

**`/api/kite/accounts` (GET)**
- Changed to query database instead of environment variables
- Returns accounts with authentication status

#### 4. Frontend Changes

**Accounts Page (`equity/app/settings/accounts/page.tsx`)**
- **Added**: API Key and API Secret input fields
- **Added**: Authentication status display (Authenticated/Not Authenticated/No Credentials)
- **Added**: "Authenticate" button for each account
- **Added**: OAuth callback handling
- **Added**: Visual indicators for authentication status

**Removed Pages:**
- `equity/app/kite-auth/page.tsx` - Removed completely

**Navigation (`equity/components/Navigation.tsx`)**
- Removed "Kite Auth" link
- All Kite authentication is now managed through Accounts page

**Other Pages:**
- Updated dashboard and live holdings pages to redirect to Accounts page instead of kite-auth

## Migration Steps

### Step 1: Run Database Migration

```bash
mysql -u db -p oneapp < equity/scripts/migrate-kite-credentials-to-db.sql
```

Or manually:

```sql
USE oneapp;

ALTER TABLE accounts 
ADD COLUMN api_key VARCHAR(255) NULL AFTER broker_id,
ADD COLUMN api_secret VARCHAR(255) NULL AFTER api_key,
ADD COLUMN access_token TEXT NULL AFTER api_secret,
ADD COLUMN access_token_expires_at TIMESTAMP NULL AFTER access_token,
ADD INDEX idx_api_key (api_key);
```

### Step 2: Migrate Existing Credentials (Optional)

If you have existing accounts configured in `.env.local`, you can manually migrate them:

1. Go to Accounts page in the web application
2. Edit each account
3. Add the API Key and API Secret from your `.env.local` file
4. Save the account

**Note**: After migration, you can remove Kite credentials from `.env.local` as they are no longer needed.

### Step 3: Verify Migration

1. **Login** to the web application
2. **Navigate** to Settings > Accounts
3. **Add/Edit** an account with Kite API credentials
4. **Click** "Authenticate" button
5. **Verify** authentication completes successfully

## Breaking Changes

### API Changes

1. **`/api/kite/execute`** now requires authentication (user session)
2. All Kite tools now require `account_id` parameter (instead of optional `client_id`)
3. `client_id` parameter is still supported for backward compatibility but maps to `account_id`

### Environment Variables

- `KITE_ACC_*` environment variables are **no longer used** by the web application
- These variables are still used by the MCP Server (if running separately)
- The web application now loads credentials from the database

## User Guide

### Adding Kite Credentials to an Account

1. Navigate to **Settings > Accounts**
2. Click **"Edit"** on an existing account or **"Add New Account"**
3. Fill in:
   - Account Name (required)
   - Broker ID (optional)
   - **Kite API Key** (optional)
   - **Kite API Secret** (optional)
4. Click **"Create"** or **"Update"**

### Authenticating an Account

1. Ensure the account has API Key and API Secret configured
2. Click **"Authenticate"** button next to the account
3. You will be redirected to Zerodha's login page
4. Log in with your Zerodha credentials
5. You will be redirected back and the account will be authenticated

### Re-authenticating

- Kite access tokens expire at the end of each trading day
- Click **"Re-authenticate"** to refresh the token
- The process is the same as initial authentication

## Security Considerations

1. **API Secrets**: Stored in database, encrypted at rest (if database encryption is enabled)
2. **Access Tokens**: Stored in database, expire daily
3. **User Isolation**: Each user can only see and manage their own accounts
4. **Database Access**: Ensure database is properly secured and access is restricted

## Rollback (if needed)

If you need to rollback to environment variable-based authentication:

1. **Remove database columns**:
   ```sql
   ALTER TABLE accounts 
   DROP COLUMN api_key,
   DROP COLUMN api_secret,
   DROP COLUMN access_token,
   DROP COLUMN access_token_expires_at,
   DROP INDEX idx_api_key;
   ```

2. **Restore old code**: Revert to previous version of:
   - `equity/lib/kite-service.ts`
   - `equity/lib/db.ts`
   - `equity/app/api/kite/*` routes
   - `equity/app/settings/accounts/page.tsx`

3. **Restore environment variables**: Add `KITE_ACC_*` variables back to `.env.local`

**Warning**: Rolling back will lose all database-stored credentials. Users will need to re-enter them in environment variables.

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Can create account with API credentials
- [ ] Can edit account to add/update API credentials
- [ ] Authentication flow works (login → redirect → callback)
- [ ] Access token is saved to database
- [ ] Can use authenticated account for Kite API calls
- [ ] User can only see their own accounts
- [ ] Re-authentication works
- [ ] Old kite-auth page is removed
- [ ] Navigation no longer shows Kite Auth link

## Notes

- The MCP Server (if running separately) still uses environment variables for its configuration
- Access tokens are stored in the database and also cached in memory for performance
- The file-based credential storage (`~/.kite-mcp-credentials.json`) is still used for backward compatibility during migration but is no longer the primary storage

