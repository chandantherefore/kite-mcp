# Quick Fix: Login Shows Login Page Again

## Problem
After entering credentials and clicking login, the page stays on the login screen instead of redirecting to the dashboard.

## Most Common Causes

### 1. Database Migration Not Run ⚠️ **MOST LIKELY**

The authentication system needs database tables that might not exist yet.

**Quick Fix:**
```bash
cd equity

# Run the migration
mysql -u db -pdb oneapp < scripts/migrate-nextauth-sessions.sql

# Restart the app
# Press Ctrl+C in the terminal running npm run dev
npm run dev
```

### 2. MySQL Not Running

**Check if MySQL is running:**
```bash
# macOS
brew services list | grep mysql

# Linux
sudo systemctl status mysql

# Or try to connect
mysql -u db -pdb oneapp -e "SELECT 1"
```

**Start MySQL if not running:**
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

### 3. NEXTAUTH_SECRET Changed or Missing

**Check env.local:**
```bash
cat env.local | grep NEXTAUTH_SECRET
```

**If missing or too short, generate a new one:**
```bash
openssl rand -base64 32
```

**Add to env.local:**
```env
NEXTAUTH_SECRET=<paste-generated-secret-here>
```

## Automated Diagnosis

Run the diagnosis script to check everything:

```bash
cd equity/scripts
./diagnose-auth.sh
```

This will check:
- Environment variables
- Database connection
- Required tables
- App status
- Dependencies

## Step-by-Step Solution

### Step 1: Check Database Connection

```bash
mysql -u db -pdb oneapp -e "SHOW TABLES;"
```

**Expected output should include:**
- `users`
- `sessions` (if this is missing, that's the issue!)
- `accounts`
- `trades`
- `ledger`
- etc.

### Step 2: Run Migration (if sessions table missing)

```bash
cd equity
mysql -u db -pdb oneapp < scripts/migrate-nextauth-sessions.sql
```

**Verify it worked:**
```bash
mysql -u db -pdb oneapp -e "SHOW TABLES LIKE 'sessions';"
```

Should output:
```
+---------------------------+
| Tables_in_oneapp (sessions) |
+---------------------------+
| sessions                  |
+---------------------------+
```

### Step 3: Restart Application

```bash
# Stop current dev server (Ctrl+C)
# Then start it again
cd equity
npm run dev
```

### Step 4: Clear Browser Cache & Cookies

1. Open DevTools (F12)
2. Go to Application tab
3. Click "Storage" → "Clear site data"
4. Or manually delete cookies for localhost:3000

### Step 5: Test Login

1. Go to http://localhost:3000/login
2. Enter credentials
3. Click "Sign In"
4. Should redirect to http://localhost:3000/dashboard

## Debugging Tips

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors when clicking login
4. Common errors:
   - "Failed to fetch" - Server not running
   - "Database error" - Database issue
   - "Invalid session" - Migration not run

### Check Server Logs

Look at the terminal where `npm run dev` is running:

**Good sign:**
```
✓ Compiled /api/auth/[...nextauth] successfully
POST /api/auth/callback/credentials 200
```

**Bad sign:**
```
Error: Table 'oneapp.sessions' doesn't exist
Database connection error
```

### Check Session Cookie

1. Open DevTools (F12)
2. Application → Cookies → http://localhost:3000
3. Look for `next-auth.session-token`
4. If present after login = Good
5. If missing = Authentication not working

### Test Database Queries

```bash
# Check if you have any users
mysql -u db -pdb oneapp -e "SELECT id, email, is_active FROM users LIMIT 5;"

# Check active sessions (after login attempt)
mysql -u db -pdb oneapp -e "SELECT COUNT(*) as active_sessions FROM sessions WHERE expires > NOW();"

# Check recent logins
mysql -u db -pdb oneapp -e "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;"
```

## Still Not Working?

### Check Application Logs

Add debug logging to see what's happening:

Edit `equity/app/api/auth/[...nextauth]/route.ts`:

```typescript
export const authOptions: NextAuthOptions = {
  // ... existing config
  debug: true, // This should already be set for development
  // ...
}
```

This will show detailed NextAuth logs in the terminal.

### Verify User Credentials

Make sure the user exists and is active:

```bash
mysql -u db -pdb oneapp -e "SELECT email, is_active, email_verified FROM users WHERE email='your-email@example.com';"
```

Should show:
- `is_active`: 1
- `email_verified`: 1

If `is_active` is 0, activate the user:
```bash
mysql -u db -pdb oneapp -e "UPDATE users SET is_active=1, email_verified=1 WHERE email='your-email@example.com';"
```

### Test with a Fresh User

Create a new test user:

```bash
# Go to http://localhost:3000/register
# Register a new account
# Verify email if required
# Try logging in with the new account
```

## Complete Restart Process

If nothing works, do a complete restart:

```bash
# 1. Stop the application (Ctrl+C)

# 2. Clear node cache
cd equity
rm -rf .next
rm -rf node_modules/.cache

# 3. Verify environment
cat env.local | grep -E "NEXTAUTH_SECRET|DATABASE"

# 4. Verify database
mysql -u db -pdb oneapp -e "SHOW TABLES;"

# 5. Run migration (if needed)
mysql -u db -pdb oneapp < scripts/migrate-nextauth-sessions.sql

# 6. Restart app
npm run dev

# 7. Clear browser completely
# - Close all tabs
# - Clear cookies and cache
# - Reopen browser

# 8. Try login again
```

## Environment Variable Checklist

Your `env.local` should have (at minimum):

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=db
DATABASE_PASSWORD=db
DATABASE_NAME=oneapp

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<min-32-chars-random-string>

# Email (if using verification)
RESEND_API_KEY=<your-key>
```

## Quick Test Script

Run this to test if authentication is working:

```bash
# Test login API endpoint
curl -X POST http://localhost:3000/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}'

# Should return something (not 404 or 500)
```

## Common Error Messages

### "Please verify your email before logging in"
**Solution:** Activate the user in database:
```sql
UPDATE users SET is_active=1, email_verified=1 WHERE email='your@email.com';
```

### "Invalid email or password"
**Solution:** Check password is correct or reset it:
```bash
# In your app, use the register page to create a new user
# Or manually update password in database (requires bcrypt hash)
```

### "Database connection error"
**Solution:** 
- Start MySQL server
- Check database credentials in env.local
- Verify database exists

### "Table 'sessions' doesn't exist"
**Solution:** Run the migration:
```bash
mysql -u db -pdb oneapp < scripts/migrate-nextauth-sessions.sql
```

## Success Indicators

You'll know it's working when:

1. ✅ Login redirects to `/dashboard`
2. ✅ Browser cookie `next-auth.session-token` is created
3. ✅ Database has record in `sessions` table
4. ✅ No errors in browser console
5. ✅ No errors in server logs
6. ✅ Protected pages are accessible
7. ✅ Logout works and clears cookie

## Need More Help?

1. Run diagnosis script: `cd equity/scripts && ./diagnose-auth.sh`
2. Check server logs when attempting login
3. Check browser console (F12) for errors
4. Verify all steps in `SETUP_INSTRUCTIONS.md`
5. Review detailed docs in `LONG_SESSION_AUTH_SETUP.md`

---

**TL;DR - Most Likely Fix:**

```bash
cd equity
mysql -u db -pdb oneapp < scripts/migrate-nextauth-sessions.sql
# Restart app (Ctrl+C then npm run dev)
# Clear browser cookies
# Try login again
```

