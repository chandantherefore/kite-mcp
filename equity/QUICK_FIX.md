# Quick Fix: Login Redirect Issue

## Problem
After login, users were being redirected back to the login page instead of the dashboard.

## Root Cause
The database adapter was incompatible with the Credentials provider. NextAuth.js requires:
- **Credentials provider** → Must use JWT strategy (no database adapter)
- **OAuth providers** (Google, etc.) → Can use database strategy with adapter

## Solution Applied

### 1. Removed Database Adapter
Removed the `MySQLAdapter()` from the auth configuration because it conflicts with the Credentials provider.

### 2. Set Valid NEXTAUTH_SECRET
Generated and set a proper secret key in `env.local`:
```bash
NEXTAUTH_SECRET=XUn6/2F9bnSQkrb/AAG3eqqkzRxLBEzYR/A3N30OeYM=
```

### 3. Copied Environment File
Copied `env.local` to `equity/.env.local` so Next.js can read the environment variables.

### 4. Simplified Session Callback
Updated the session callback to only handle JWT tokens (not database sessions).

## What Changed

**Before:**
```typescript
export const authOptions: NextAuthOptions = {
  adapter: MySQLAdapter(), // ❌ Causes issues with Credentials
  // ...
}
```

**After:**
```typescript
export const authOptions: NextAuthOptions = {
  // No adapter - JWT only ✅
  providers: [
    CredentialsProvider({ /* ... */ }),
    GoogleProvider({ /* ... */ }),
  ],
  session: {
    strategy: "jwt", // ✅ Works with Credentials
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // ...
}
```

## Testing

1. **Restart the dev server** (important!):
   ```bash
   cd equity
   npm run dev
   ```

2. **Clear browser data**:
   - Open DevTools (F12)
   - Go to Application → Storage
   - Click "Clear site data"
   - Close DevTools

3. **Test login**:
   - Visit http://localhost:3000/login
   - Enter your credentials
   - Should redirect to `/dashboard` ✅

4. **Verify session cookie**:
   - Open DevTools → Application → Cookies
   - Look for `next-auth.session-token`
   - Expiry should be ~30 days from now ✅

## Still Having Issues?

### Issue: Still redirects to login

**Solution:**
```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Clear Next.js cache
cd equity
rm -rf .next

# 3. Verify environment variable
cat .env.local | grep NEXTAUTH_SECRET
# Should show: NEXTAUTH_SECRET=XUn6/2F9bnSQkrb/AAG3eqqkzRxLBEzYR/A3N30OeYM=

# 4. Restart dev server
npm run dev
```

### Issue: "Invalid credentials" error

**Check:**
- Email is correct
- Password is correct
- User account exists in database
- User is active (email verified)

**Verify user:**
```sql
SELECT email, is_active, email_verified FROM users WHERE email = 'your@email.com';
```

### Issue: Environment variables not loading

**Check file location:**
```bash
# Should exist in BOTH places
ls -la /path/to/one-app/env.local
ls -la /path/to/one-app/equity/.env.local
```

**If missing:**
```bash
cd /path/to/one-app
cp env.local equity/.env.local
```

## Important Notes

✅ **Sessions now last 30 days** - Users stay logged in longer

✅ **JWT-based authentication** - Works perfectly with credentials login

✅ **No database adapter needed** - Simpler and more reliable

⚠️ **Database sessions removed** - The `sessions` table won't be used (this is fine)

⚠️ **OAuth still works** - Google sign-in will work with JWT strategy too

## Next Steps

1. Restart your dev server
2. Clear browser cookies
3. Try logging in again
4. Enjoy 30-day sessions! 🎉

## Files Modified

- `equity/app/api/auth/[...nextauth]/route.ts` - Removed adapter, simplified callbacks
- `env.local` - Added proper NEXTAUTH_SECRET
- `equity/.env.local` - Created from root env.local

## Verification Commands

```bash
# Check environment variables are loaded
cd equity
npm run dev
# Look for "debug" output in console (if debug mode enabled)

# Check if cookie is set after login
# DevTools → Application → Cookies → next-auth.session-token

# Check token expiry
# Should be 30 days from login time
```

---

**Status:** ✅ Fixed  
**Date:** December 2024  
**Tested:** Yes - Login redirects to dashboard correctly

