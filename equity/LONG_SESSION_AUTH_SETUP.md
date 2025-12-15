# Long-Lasting Database Authentication Setup

## Overview

This application now uses database-backed authentication with NextAuth.js that provides long-lasting sessions (30 days) for a better user experience. Users won't need to log in frequently.

## Key Features

✅ **Long Session Duration**: Sessions last for 30 days instead of the default 24 hours  
✅ **Database-Backed Sessions**: OAuth sessions (Google) are stored in the database  
✅ **JWT for Credentials**: Email/password authentication uses JWT tokens with extended expiry  
✅ **Auto-Refresh**: Sessions are automatically refreshed when users are active  
✅ **Secure**: Uses httpOnly cookies with proper security configurations  
✅ **Multi-Provider**: Supports both email/password and Google OAuth authentication  

## Architecture

### Session Strategies

The application uses a **hybrid approach**:

1. **JWT Strategy** (for Email/Password login)
   - Used when users log in with credentials
   - JWT tokens stored in httpOnly cookies
   - Valid for 30 days
   - Auto-refreshed every 24 hours when user is active

2. **Database Strategy** (for OAuth - Google)
   - Used when users log in with Google
   - Sessions stored in MySQL database
   - Supports session management and tracking
   - Can be extended to other OAuth providers

### Why Hybrid?

NextAuth.js **requires JWT** for Credentials Provider but **supports database** for OAuth providers. Our hybrid approach:
- Maximizes security for OAuth (database tracking)
- Enables credentials login (JWT)
- Provides long sessions for both

## Database Setup

### Step 1: Run Migration

Run the SQL migration to create required tables:

```bash
# Navigate to the equity directory
cd equity

# Run the migration script
mysql -u db -p oneapp < scripts/migrate-nextauth-sessions.sql
```

Or manually execute the SQL:

```sql
-- See: equity/scripts/migrate-nextauth-sessions.sql
```

### Step 2: Verify Tables

The migration creates these tables:

1. **sessions** - Stores active user sessions
   - `id`: Unique session identifier
   - `user_id`: Foreign key to users table
   - `session_token`: Unique token for session lookup
   - `expires`: Session expiration timestamp
   - `created_at`, `updated_at`: Tracking timestamps

2. **verification_tokens** - For email verification and password reset
   - `identifier`: User identifier (email)
   - `token`: Verification token
   - `expires`: Token expiration

### Step 3: Automated Cleanup

The migration also creates a scheduled event to clean up expired sessions daily:

```sql
-- Runs daily at midnight
CREATE EVENT cleanup_expired_sessions
```

This keeps your database clean and performant.

## Environment Configuration

### Required Environment Variables

Update your `.env.local` file with:

```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=db
DATABASE_PASSWORD=db
DATABASE_NAME=oneapp

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-a-secure-random-string>
PORT=3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Email Service
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=noreply@yourdomain.com
```

### Generating NEXTAUTH_SECRET

The `NEXTAUTH_SECRET` must be a secure random string (minimum 32 characters). Generate one using:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# Visit: https://generate-secret.vercel.app/32
```

⚠️ **Important**: Never commit your actual `NEXTAUTH_SECRET` to version control!

## Session Configuration

### Current Settings

```typescript
session: {
  strategy: "jwt",           // JWT for credentials, database for OAuth
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,   // Refresh every 24 hours
}

jwt: {
  maxAge: 30 * 24 * 60 * 60, // 30 days
}

cookies: {
  sessionToken: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
}
```

### Customizing Session Duration

To change session duration, update these values in `app/api/auth/[...nextauth]/route.ts`:

```typescript
// Example: 7 days instead of 30
const sessionDuration = 7 * 24 * 60 * 60; // 7 days in seconds

session: {
  maxAge: sessionDuration,
  updateAge: 24 * 60 * 60, // Still refresh daily
}

jwt: {
  maxAge: sessionDuration,
}

cookies: {
  sessionToken: {
    maxAge: sessionDuration,
  }
}
```

## How It Works

### User Login Flow

#### 1. Credentials (Email/Password)

```
User enters email/password
    ↓
CredentialsProvider validates against database
    ↓
JWT token created with user info (id, email, role)
    ↓
Token stored in httpOnly cookie
    ↓
Token valid for 30 days
    ↓
User stays logged in
```

#### 2. Google OAuth

```
User clicks "Sign in with Google"
    ↓
Google authentication
    ↓
User info retrieved from Google
    ↓
User created/updated in database
    ↓
Session created in database
    ↓
Session token stored in httpOnly cookie
    ↓
Session valid for 30 days
    ↓
User stays logged in
```

### Session Refresh

Sessions are automatically refreshed when:
- User is active (makes any request)
- 24 hours have passed since last update
- Session hasn't expired yet

This means:
- ✅ Active users: Session never expires (refreshed daily)
- ❌ Inactive users: Session expires after 30 days

## Security Considerations

### 1. Cookie Security

```typescript
cookies: {
  sessionToken: {
    httpOnly: true,           // Cannot be accessed by JavaScript
    sameSite: 'lax',         // CSRF protection
    secure: production,       // HTTPS only in production
    maxAge: 30 days,         // Long-lasting
  }
}
```

### 2. Token Validation

Every request validates:
- Token signature (JWT)
- Token expiration
- User still exists in database
- User is still active

### 3. Session Revocation

To revoke a user's session:

```sql
-- For JWT (credentials) - user must log in again after:
UPDATE users SET updated_at = NOW() WHERE id = ?;

-- For Database (OAuth) - delete session:
DELETE FROM sessions WHERE user_id = ?;
```

### 4. Password Security

- Passwords hashed with bcrypt (10 rounds)
- No password stored for OAuth users
- Email verification required before first login

## Testing

### Test Long Session

1. **Login**:
   ```bash
   # Visit http://localhost:3000/login
   # Login with credentials or Google
   ```

2. **Verify Session Cookie**:
   ```bash
   # Open DevTools → Application → Cookies
   # Check: next-auth.session-token
   # Expires: Should be ~30 days from now
   ```

3. **Test Session Persistence**:
   ```bash
   # Close browser
   # Reopen browser
   # Visit application
   # Should still be logged in (without redirect to login)
   ```

4. **Test Auto-Refresh**:
   ```bash
   # Stay logged in for 24+ hours
   # Make any request (refresh page)
   # Check cookie expiration - should be extended
   ```

### Test Session Expiration

```bash
# Option 1: Wait 30 days (not practical)
# Option 2: Temporarily change maxAge to 60 seconds for testing

session: {
  maxAge: 60, // 60 seconds for testing
}

# Login, wait 61 seconds, refresh page
# Should be redirected to login
```

## Monitoring

### Check Active Sessions

```sql
-- Count active sessions
SELECT COUNT(*) as active_sessions 
FROM sessions 
WHERE expires > NOW();

-- View sessions by user
SELECT 
  u.email,
  s.created_at,
  s.expires,
  TIMESTAMPDIFF(DAY, NOW(), s.expires) as days_until_expiry
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires > NOW()
ORDER BY s.created_at DESC;
```

### Check Expired Sessions

```sql
-- Count expired sessions
SELECT COUNT(*) as expired_sessions 
FROM sessions 
WHERE expires <= NOW();

-- Manually clean up (if event not running)
DELETE FROM sessions WHERE expires <= NOW();
```

## Troubleshooting

### Issue: Users logged out after restart

**Cause**: Missing or changing `NEXTAUTH_SECRET`

**Solution**: 
1. Set a permanent `NEXTAUTH_SECRET` in `.env.local`
2. Never change this value (invalidates all sessions)

### Issue: "Database session not found"

**Cause**: Session table not created or migration not run

**Solution**:
```bash
mysql -u db -p oneapp < scripts/migrate-nextauth-sessions.sql
```

### Issue: Session expires too quickly

**Cause**: Cookie maxAge not matching session maxAge

**Solution**: Verify all maxAge values are consistent (30 days)

### Issue: "Invalid session token"

**Cause**: Token signature validation failed

**Solution**:
1. Check `NEXTAUTH_SECRET` hasn't changed
2. Check `NEXTAUTH_URL` matches your domain
3. Clear browser cookies and login again

## Migration from Existing Setup

If you're upgrading from a previous authentication setup:

### 1. Backup Database

```bash
mysqldump -u db -p oneapp > backup_before_auth_migration.sql
```

### 2. Run Migration

```bash
mysql -u db -p oneapp < scripts/migrate-nextauth-sessions.sql
```

### 3. Update Environment

Add required environment variables (see above)

### 4. Restart Application

```bash
cd equity
npm run dev
```

### 5. Test Thoroughly

- Test credentials login
- Test Google OAuth
- Test session persistence
- Test session expiration
- Check existing users can still login

### 6. User Impact

⚠️ **Important**: All existing users will be logged out after this migration. This is expected because:
- Session strategy is changing
- Cookie structure is changing
- Secret might be new

Notify users they'll need to log in again after the update.

## Production Deployment

### Checklist

- [ ] Set strong `NEXTAUTH_SECRET` (32+ characters, random)
- [ ] Set correct `NEXTAUTH_URL` (your production domain)
- [ ] Enable `secure` cookies (HTTPS only)
- [ ] Run database migration on production database
- [ ] Verify cleanup event is scheduled
- [ ] Set up session monitoring
- [ ] Test login flow in production
- [ ] Update any API clients expecting shorter sessions

### Environment

```bash
# Production example
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<very-secure-random-string>
DATABASE_HOST=production-db-host
# ... other production values
```

## API Changes

### Get Current User

No changes needed - existing code works:

```typescript
import { getCurrentUser } from '@/lib/auth';

// In server component or API route
const user = await getCurrentUser();
if (user) {
  console.log(user.id, user.email, user.role);
}
```

### Require Authentication

No changes needed:

```typescript
import { requireAuth } from '@/lib/auth';

// In API route
const user = await requireAuth(); // Throws if not authenticated
```

### Session Object

Session now includes (30-day expiry):

```typescript
{
  user: {
    id: string,
    email: string,
    name: string,
    role: "user" | "admin"
  },
  expires: "2024-01-15T00:00:00.000Z" // 30 days from login
}
```

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [JWT vs Database Sessions](https://next-auth.js.org/configuration/sessions)
- [Security Best Practices](https://next-auth.js.org/security)

## Support

For issues or questions:
1. Check this documentation
2. Review `app/api/auth/[...nextauth]/route.ts`
3. Check database tables and data
4. Review application logs
5. Test with debug mode: `debug: true` in authOptions

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Tested With**: NextAuth v4.24.13, MySQL 8.0, Next.js 14.2

