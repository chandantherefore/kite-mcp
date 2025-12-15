# DevOps Architecture

## Overview

This document describes the deployment, infrastructure, and operational aspects of the OneApp Portfolio application.

## Current Deployment Status

**Status**: Local development setup documented

**Production Deployment**: Not yet configured

## Local Development

### Development Environment

**Requirements**:
- Node.js v20.x or higher
- MySQL 8.0+
- npm v10.x or higher

**Setup**:
1. Clone repository
2. Install dependencies (`npm install` in root and `equity/`)
3. Configure database (see `Documentation/1-Getting-Started.md`)
4. Set environment variables (`equity/.env.local`)
5. Run migrations
6. Start dev server (`npm run dev` in `equity/`)

### Development Server

**Command**: `npm run dev` (in `equity/`)

**Port**: 3000 (configurable via `PORT` env var)

**Features**:
- Hot module replacement
- Fast refresh
- Development error overlay
- Source maps

## Production Deployment

### Build Process

**Build Command**: `npm run build` (in `equity/`)

**Output**: `.next/` directory with optimized production build

**Start Command**: `npm start` (in `equity/`)

### Environment Variables

**Required for Production**:
- `DATABASE_HOST` - Production database host
- `DATABASE_USER` - Production database user
- `DATABASE_PASSWORD` - Strong production password
- `DATABASE_NAME` - Database name
- `NEXTAUTH_URL` - Production URL (https://yourdomain.com)
- `NEXTAUTH_SECRET` - Strong random secret (min 32 chars)

**Optional**:
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `RESEND_API_KEY` - For email verification
- `EMAIL_FROM` - Verified email address

### Security Considerations

1. **HTTPS Required**: OAuth callbacks require HTTPS
2. **Secret Management**: Use environment variable management (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Database Security**: 
   - Strong passwords
   - IP restrictions
   - SSL connections
4. **Session Security**: 
   - HTTP-only cookies
   - SameSite protection
   - Secure flag in production

## Database Management

### Migration Strategy

**Location**: `equity/scripts/`

**Migration Order**:
1. `migrate-users-table.sql`
2. `migrate-accounts-user-id.sql`
3. `migrate-kite-credentials-to-db.sql`
4. `setup-balancesheet.sql`
5. `migrate-banks-schema.sql`
6. `migrate-nextauth-sessions.sql` (optional, for long sessions)

**Execution**:
```bash
mysql -u user -p database < script.sql
```

### Backup Strategy

**Recommended**:
- Daily automated backups
- Point-in-time recovery
- Backup retention policy
- Test restore procedures

**Backup Command**:
```bash
mysqldump -u user -p oneapp > backup_$(date +%Y%m%d).sql
```

### Database Maintenance

- Regular index optimization
- Query performance monitoring
- Connection pool monitoring
- Deadlock detection

## CI/CD

### Current Status

**Status**: Not configured

### Recommended Setup

**CI Pipeline**:
1. Lint code (`npm run lint`)
2. Type check (`tsc --noEmit`)
3. Run tests (if configured)
4. Build application
5. Security scan

**CD Pipeline**:
1. Deploy to staging
2. Run smoke tests
3. Deploy to production
4. Health checks

## Monitoring

### Application Monitoring

**Recommended Tools**:
- Error tracking (Sentry, Rollbar)
- Performance monitoring (New Relic, Datadog)
- Uptime monitoring
- Log aggregation

### Database Monitoring

**Metrics to Track**:
- Connection pool usage
- Query performance
- Slow queries
- Deadlocks
- Table sizes

### Logging

**Current**: Console logging (`console.log`, `console.error`)

**Recommended**:
- Structured logging (JSON format)
- Log levels (info, warn, error)
- Log aggregation service
- Retention policy

## Infrastructure

### Server Requirements

**Minimum**:
- 2 CPU cores
- 4 GB RAM
- 20 GB storage

**Recommended**:
- 4 CPU cores
- 8 GB RAM
- 50 GB storage
- SSD storage

### Database Requirements

**Minimum**:
- 2 CPU cores
- 4 GB RAM
- 50 GB storage

**Recommended**:
- 4 CPU cores
- 8 GB RAM
- 100 GB storage
- SSD storage
- Automated backups

## Scaling Considerations

### Horizontal Scaling

**Application**:
- Stateless application (can scale horizontally)
- Session stored in JWT (no shared session store needed)
- Load balancer required

**Database**:
- Read replicas for read-heavy workloads
- Connection pooling per instance
- Database sharding (if needed)

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Add caching layer (Redis, Memcached)

## Disaster Recovery

### Backup Strategy

- Database backups (daily)
- Code repository (Git)
- Environment configuration (version controlled)

### Recovery Procedures

1. Restore database from backup
2. Deploy application code
3. Verify environment variables
4. Run health checks
5. Monitor for issues

## Security

### Application Security

- HTTPS only in production
- Secure cookies (httpOnly, sameSite, secure)
- Password hashing (bcrypt, cost factor 10)
- SQL injection prevention (parameterized queries)
- XSS prevention (React automatic escaping)
- CSRF protection (NextAuth.js)

### Infrastructure Security

- Firewall rules
- Network isolation
- Regular security updates
- Vulnerability scanning
- Access control

## Performance

### Optimization Strategies

1. **Database**:
   - Indexed queries
   - Connection pooling
   - Query optimization

2. **Application**:
   - Server Components (reduced JavaScript)
   - Code splitting
   - Image optimization

3. **Caching**:
   - Response caching (if needed)
   - Database query caching
   - CDN for static assets

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check database is running
   - Verify credentials
   - Check network connectivity
   - Verify connection pool settings

2. **Authentication Issues**:
   - Check `NEXTAUTH_SECRET` is set
   - Verify `NEXTAUTH_URL` matches deployment URL
   - Check OAuth redirect URIs

3. **Performance Issues**:
   - Check database query performance
   - Monitor connection pool usage
   - Review slow queries
   - Check server resources

## Future Improvements

1. **CI/CD Pipeline**: Automated testing and deployment
2. **Monitoring**: Application and infrastructure monitoring
3. **Caching**: Redis for session and data caching
4. **CDN**: Content delivery network for static assets
5. **Containerization**: Docker for consistent deployments
6. **Orchestration**: Kubernetes for container orchestration

