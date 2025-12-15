# Quick Setup: Long-Lasting Authentication

This guide will help you set up database-backed authentication with 30-day session validity.

## Quick Start (Automated)

Run the automated setup script:

```bash
cd equity/scripts
./setup-long-sessions.sh
```

The script will:
- ✅ Check your environment variables
- ✅ Generate a secure `NEXTAUTH_SECRET` if needed
- ✅ Test database connection
- ✅ Run the migration
- ✅ Verify tables were created
- ✅ Check event scheduler status

## Quick Start (Manual)

### 1. Update Environment Variables

Edit `env.local` and ensure these are set:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=db
DATABASE_PASSWORD=db
DATABASE_NAME=oneapp

# NextAuth (generate a secure random string)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secure-secret-min-32-chars>
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 2. Run Database Migration

```bash
cd equity
mysql -u db -p oneapp < scripts/migrate-nextauth-sessions.sql
```

Enter your database password when prompted.

### 3. Restart Application

```bash
cd equity
npm run dev
```

### 4. Test It

1. Visit http://localhost:3000/login
2. Login with your credentials or Google
3. Check browser cookies (DevTools → Application → Cookies)
4. Look for `next-auth.session-token` - should expire in ~30 days
5. Close and reopen browser - you should still be logged in!

## What Changed?

### Before
- ❌ Sessions lasted 24 hours
- ❌ Users had to login daily
- ❌ JWT-only (no session tracking)

### After
- ✅ Sessions last 30 days
- ✅ Auto-refresh while active
- ✅ Database tracking for OAuth
- ✅ Hybrid JWT + Database approach

## Session Duration

Current configuration: **30 days**

To change it, edit `app/api/auth/[...nextauth]/route.ts`:

```typescript
session: {
  maxAge: 30 * 24 * 60 * 60,  // Change this
}
```

## Database Tables

The migration creates:

1. **sessions** - Active user sessions (OAuth)
2. **verification_tokens** - Email verification tokens

## Architecture

```
┌─────────────────────────────────────────┐
│         User Authentication             │
├─────────────────────────────────────────┤
│                                         │
│  Email/Password Login                   │
│  ├─ Strategy: JWT                       │
│  ├─ Storage: httpOnly Cookie            │
│  └─ Duration: 30 days                   │
│                                         │
│  Google OAuth Login                     │
│  ├─ Strategy: Database                  │
│  ├─ Storage: sessions table + cookie    │
│  └─ Duration: 30 days                   │
│                                         │
│  Auto-Refresh: Every 24 hours           │
│  Security: httpOnly, sameSite, secure   │
└─────────────────────────────────────────┘
```

## Security Features

✅ httpOnly cookies (no JavaScript access)  
✅ CSRF protection (sameSite)  
✅ HTTPS in production (secure flag)  
✅ Bcrypt password hashing  
✅ Email verification required  
✅ Session validation on every request  
✅ Automatic cleanup of expired sessions  

## Troubleshooting

### Issue: "Cannot connect to database"
- Check `DATABASE_*` variables in env.local
- Verify MySQL is running
- Test connection: `mysql -u db -p`

### Issue: "Migration failed"
- Check database user has CREATE TABLE permissions
- Verify database exists: `SHOW DATABASES;`
- Check for syntax errors in SQL

### Issue: Users logged out after restart
- Set a permanent `NEXTAUTH_SECRET` in env.local
- Never change this secret (invalidates all sessions)

### Issue: Session expires too quickly
- Check `maxAge` settings in route.ts
- Verify cookie maxAge matches session maxAge
- Check browser cookie settings

## Files Modified/Created

```
equity/
├── app/api/auth/[...nextauth]/route.ts   (modified)
├── lib/nextauth-adapter.ts               (created)
├── scripts/
│   ├── migrate-nextauth-sessions.sql     (created)
│   └── setup-long-sessions.sh            (created)
├── env.local                             (modified)
├── LONG_SESSION_AUTH_SETUP.md           (created)
└── SETUP_INSTRUCTIONS.md                 (this file)
```

## Testing Checklist

- [ ] Run migration successfully
- [ ] Restart application
- [ ] Login with email/password
- [ ] Check session cookie (30-day expiry)
- [ ] Close and reopen browser
- [ ] Still logged in (no redirect to login)
- [ ] Login with Google OAuth (if configured)
- [ ] Check sessions table has records
- [ ] Test after 24 hours (session auto-refreshed)

## Production Deployment

Before deploying to production:

1. **Generate secure secret**:
   ```bash
   openssl rand -base64 32
   ```

2. **Update environment**:
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=<production-secret>
   DATABASE_HOST=<production-db>
   ```

3. **Run migration on production DB**

4. **Enable HTTPS** (secure cookies require it)

5. **Test thoroughly** before rolling out

6. **Notify users** they'll need to log in again after update

## Support & Documentation

- **Detailed docs**: See `LONG_SESSION_AUTH_SETUP.md`
- **NextAuth docs**: https://next-auth.js.org/
- **Code**: See `app/api/auth/[...nextauth]/route.ts`

## Summary

You now have:
- ✅ Long-lasting sessions (30 days)
- ✅ Database-backed authentication
- ✅ Auto-refresh functionality
- ✅ Secure cookie handling
- ✅ Support for both credentials and OAuth

Users will stay logged in for 30 days (or until they manually log out) and sessions will automatically refresh when they're active.

---

**Need help?** Check `LONG_SESSION_AUTH_SETUP.md` for comprehensive documentation.

