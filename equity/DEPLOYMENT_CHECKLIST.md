# Deployment Checklist: Long-Lasting Authentication

Use this checklist to deploy the new authentication system.

## Pre-Deployment

### 1. Environment Setup
- [ ] Generate secure `NEXTAUTH_SECRET` (minimum 32 characters)
  ```bash
  openssl rand -base64 32
  ```
- [ ] Add to `env.local`:
  ```bash
  NEXTAUTH_SECRET=<your-generated-secret>
  NEXTAUTH_URL=http://localhost:3000
  ```
- [ ] Verify database credentials in `env.local`
- [ ] Save `NEXTAUTH_SECRET` to password manager (never lose it!)

### 2. Database Migration
- [ ] Backup current database
  ```bash
  mysqldump -u db -p oneapp > backup_$(date +%Y%m%d).sql
  ```
- [ ] Run migration (choose one):
  
  **Automated:**
  ```bash
  cd equity/scripts
  ./setup-long-sessions.sh
  ```
  
  **Manual:**
  ```bash
  cd equity
  mysql -u db -p oneapp < scripts/migrate-nextauth-sessions.sql
  ```

### 3. Verify Migration
- [ ] Check tables created:
  ```sql
  SHOW TABLES LIKE '%session%';
  SHOW TABLES LIKE '%verification%';
  ```
- [ ] Verify indexes:
  ```sql
  SHOW INDEX FROM sessions;
  ```
- [ ] Check event scheduler:
  ```sql
  SHOW VARIABLES LIKE 'event_scheduler';
  -- Should be ON
  ```

## Local Testing

### 4. Start Application
- [ ] Install dependencies (if needed):
  ```bash
  cd equity
  npm install
  ```
- [ ] Start dev server:
  ```bash
  npm run dev
  ```
- [ ] Check for errors in console

### 5. Test Credentials Login
- [ ] Visit http://localhost:3000/login
- [ ] Login with email/password
- [ ] Verify successful login
- [ ] Check DevTools → Application → Cookies
- [ ] Verify `next-auth.session-token` exists
- [ ] Check expiry date (~30 days from now)
- [ ] Navigate to different pages
- [ ] Verify authentication persists

### 6. Test Session Persistence
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Visit http://localhost:3000
- [ ] Should still be logged in ✓
- [ ] No redirect to login page ✓

### 7. Test Google OAuth (if configured)
- [ ] Visit http://localhost:3000/login
- [ ] Click "Sign in with Google"
- [ ] Complete OAuth flow
- [ ] Verify successful login
- [ ] Check database:
  ```sql
  SELECT * FROM sessions WHERE user_id = ?;
  ```
- [ ] Verify session record exists

### 8. Test Logout
- [ ] Click logout button
- [ ] Verify cookie is cleared
- [ ] Verify redirect to login
- [ ] Check database (OAuth):
  ```sql
  SELECT * FROM sessions WHERE user_id = ?;
  -- Should be empty or expired
  ```

### 9. Database Verification
- [ ] Check active sessions:
  ```sql
  SELECT COUNT(*) FROM sessions WHERE expires > NOW();
  ```
- [ ] View session details:
  ```sql
  SELECT 
    u.email,
    s.created_at,
    s.expires,
    TIMESTAMPDIFF(DAY, NOW(), s.expires) as days_remaining
  FROM sessions s
  JOIN users u ON s.user_id = u.id
  WHERE s.expires > NOW();
  ```

### 10. Security Checks
- [ ] Verify cookies are httpOnly (DevTools)
- [ ] Verify cookies are sameSite=lax
- [ ] Verify session validates on protected routes
- [ ] Test unauthorized access to protected pages
- [ ] Verify email verification still works

## Production Deployment

### 11. Production Environment
- [ ] Generate NEW production `NEXTAUTH_SECRET`
  ```bash
  openssl rand -base64 32
  ```
- [ ] Set production environment variables:
  ```bash
  NEXTAUTH_URL=https://yourdomain.com
  NEXTAUTH_SECRET=<production-secret>
  DATABASE_HOST=<production-db-host>
  DATABASE_USER=<production-db-user>
  DATABASE_PASSWORD=<production-db-password>
  DATABASE_NAME=<production-db-name>
  ```
- [ ] Verify HTTPS is enabled (required for secure cookies)

### 12. Production Database
- [ ] Backup production database
  ```bash
  mysqldump -h <prod-host> -u <user> -p <dbname> > prod_backup_$(date +%Y%m%d).sql
  ```
- [ ] Test database connection
- [ ] Run migration on production:
  ```bash
  mysql -h <prod-host> -u <user> -p <dbname> < scripts/migrate-nextauth-sessions.sql
  ```
- [ ] Verify tables created
- [ ] Verify event scheduler is ON

### 13. Notify Users
- [ ] Send notification about maintenance window
- [ ] Inform users they'll need to log in again
- [ ] Highlight benefits (stay logged in longer)
- [ ] Provide support contact for issues

### 14. Deploy Code
- [ ] Commit changes to version control
- [ ] Push to production branch
- [ ] Deploy application
- [ ] Monitor deployment logs

### 15. Post-Deployment Testing
- [ ] Test login on production
- [ ] Verify cookie settings (secure, httpOnly)
- [ ] Test session persistence
- [ ] Test logout functionality
- [ ] Check database for session records
- [ ] Monitor error logs
- [ ] Test from different browsers
- [ ] Test from mobile devices

### 16. Monitoring
- [ ] Set up monitoring for:
  - [ ] Active sessions count
  - [ ] Failed login attempts
  - [ ] Session creation rate
  - [ ] Database table sizes
- [ ] Check cleanup event is running:
  ```sql
  SHOW EVENTS WHERE name = 'cleanup_expired_sessions';
  ```

### 17. Performance Check
- [ ] Monitor database performance
- [ ] Check query execution times
- [ ] Verify indexes are being used
- [ ] Monitor memory usage
- [ ] Check application response times

## Rollback Plan (If Needed)

### 18. Rollback Preparation
- [ ] Document current state
- [ ] Have backup ready
- [ ] Know rollback commands
- [ ] Have team available

### 19. Rollback Steps (if needed)
- [ ] Revert code changes:
  ```bash
  git revert <commit-hash>
  git push production
  ```
- [ ] Restore environment variables
- [ ] Restart application
- [ ] Verify old authentication works
- [ ] Keep database tables (won't hurt)
- [ ] Notify users of rollback

## Post-Deployment

### 20. Week 1 Monitoring
- [ ] Daily check of active sessions
- [ ] Monitor login success rate
- [ ] Check for authentication errors
- [ ] Verify cleanup event runs daily
- [ ] Monitor database growth
- [ ] Collect user feedback

### 21. Week 2-4 Monitoring
- [ ] Weekly session statistics
- [ ] Verify auto-refresh works (after 24h)
- [ ] Check no sessions expire prematurely
- [ ] Monitor for any security issues
- [ ] Verify expired sessions are cleaned up

### 22. Documentation
- [ ] Update internal documentation
- [ ] Update user guides
- [ ] Document any issues encountered
- [ ] Share lessons learned with team

## Troubleshooting Reference

### Issue: Users can't log in
**Check:**
- [ ] NEXTAUTH_SECRET is set
- [ ] Database connection works
- [ ] Sessions table exists
- [ ] NEXTAUTH_URL is correct

### Issue: Sessions expire too quickly
**Check:**
- [ ] All maxAge values are 30 days
- [ ] Cookie maxAge matches session maxAge
- [ ] System time is correct

### Issue: Database sessions not created
**Check:**
- [ ] Migration ran successfully
- [ ] Tables have correct schema
- [ ] Foreign keys are valid
- [ ] OAuth provider is configured

### Issue: Cleanup event not running
**Check:**
```sql
-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Verify event exists
SHOW EVENTS;

-- Check event status
SELECT * FROM information_schema.EVENTS 
WHERE event_name = 'cleanup_expired_sessions';
```

## Success Criteria

- ✅ Users can log in with credentials
- ✅ Users can log in with Google (if configured)
- ✅ Sessions last 30 days
- ✅ Sessions persist across browser restarts
- ✅ Sessions auto-refresh after 24h activity
- ✅ Logout works correctly
- ✅ Database cleanup runs daily
- ✅ No authentication errors in logs
- ✅ All security checks pass
- ✅ Performance is acceptable

## Documentation References

- **Quick Setup:** `SETUP_INSTRUCTIONS.md`
- **Detailed Guide:** `LONG_SESSION_AUTH_SETUP.md`
- **Overview:** `AUTHENTICATION_UPGRADE.md`
- **Migration SQL:** `scripts/migrate-nextauth-sessions.sql`
- **Setup Script:** `scripts/setup-long-sessions.sh`

## Support Contacts

- **Technical Issues:** [Your team contact]
- **User Issues:** [Support email]
- **Emergency:** [On-call contact]

---

## Quick Commands Reference

```bash
# Generate secret
openssl rand -base64 32

# Backup database
mysqldump -u db -p oneapp > backup.sql

# Run migration
mysql -u db -p oneapp < scripts/migrate-nextauth-sessions.sql

# Check sessions
mysql -u db -p oneapp -e "SELECT COUNT(*) FROM sessions WHERE expires > NOW()"

# Start app
cd equity && npm run dev

# View logs
tail -f logs/app.log  # adjust path as needed
```

---

**Deployment Date:** _________________  
**Deployed By:** _________________  
**Sign-off:** _________________  

---

Print this checklist and check off items as you complete them!

