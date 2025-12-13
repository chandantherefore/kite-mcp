# Security Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [Route Protection](#route-protection)
5. [API Security](#api-security)
6. [Data Security](#data-security)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## Overview

This document describes the security architecture and practices implemented in the Portfolio Manager application. The system follows a defense-in-depth approach with multiple layers of security.

## Authentication

### Authentication Methods

1. **Credentials (Email/Password)**
   - Passwords are hashed using bcrypt (cost factor 10)
   - Email verification required before account activation
   - Session-based authentication using JWT tokens

2. **Google OAuth**
   - Secure OAuth 2.0 flow
   - Pre-verified email addresses
   - Automatic account creation for new users

### Session Management

- **JWT Tokens**: Stored securely by NextAuth.js
- **Session Expiration**: Configurable session timeout
- **Token Refresh**: Automatic token refresh on activity
- **Secure Storage**: Tokens never exposed to client-side JavaScript unnecessarily

### Authentication Flow

```
1. User submits credentials
   ↓
2. Server validates credentials
   ↓
3. If valid, create JWT session
   ↓
4. Session stored in secure HTTP-only cookie
   ↓
5. Subsequent requests include session token
   ↓
6. Middleware validates token on each request
```

## Authorization

### Role-Based Access Control (RBAC)

**Roles**:
- **user**: Standard user with access to their own data
- **admin**: Administrative access to user management

### User Isolation

- Users can only access their own resources
- Database queries filter by `user_id`
- API endpoints verify resource ownership
- Foreign key constraints enforce data isolation

### Authorization Checks

**Server-Side Validation**:
- All authorization checks happen server-side
- Client-side checks are for UX only
- API routes validate ownership before operations

**Authorization Utilities** (`lib/auth.ts`):
- `getCurrentUser()`: Get current authenticated user
- `requireAuth()`: Require authentication (throws if not authenticated)
- `requireAdmin()`: Require admin role (throws if not admin)
- `checkResourceOwnership()`: Check if user owns a resource
- `requireResourceOwnership()`: Require resource ownership

## Route Protection

### Middleware Protection

**Location**: `middleware.ts`

The middleware protects all routes except public ones:

**Public Routes** (no authentication required):
- `/login`
- `/register`
- `/verify-email`
- `/api/auth/*`

**Protected Routes** (authentication required):
- All other routes require valid session token

**Admin Routes** (admin role required):
- `/admin/*`

### Route Protection Behavior

**For Unauthenticated Users**:
- **API Routes**: Return `401 Unauthorized`
- **Page Routes**: Redirect to `/login`

**For Authenticated Non-Admin Users**:
- **Admin API Routes**: Return `403 Forbidden`
- **Admin Page Routes**: Return `403 Forbidden` or redirect

**For Authenticated Users**:
- Access granted to their own resources
- `404 Not Found` for resources they don't own

### Layout-Based Protection

Server-side layout components can protect entire route groups:

```typescript
// app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  await requireAdmin(); // Throws if not admin
  return <>{children}</>;
}
```

## API Security

### API Route Protection

All API routes follow this pattern:

```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(); // Throws if not authenticated
    // ... route logic
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // ... other error handling
  }
}
```

### HTTP Status Codes

**401 Unauthorized**:
- User is not authenticated
- No valid session token
- Used when authentication is required but missing

**403 Forbidden**:
- User is authenticated but lacks permission
- User doesn't have required role
- User doesn't own the resource
- Used when authorization fails

**404 Not Found**:
- Resource doesn't exist
- User doesn't have access to resource (security through obscurity)
- Used to prevent information disclosure

### Resource Ownership Validation

All resource access validates ownership:

```typescript
// Example: Get account by ID
const account = await db.getAccountById(accountId, userId);
if (!account) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

## Data Security

### Database Security

- **Prepared Statements**: All queries use parameterized queries
- **SQL Injection Prevention**: No string concatenation in queries
- **Connection Pooling**: Secure connection management
- **User Isolation**: Foreign key constraints enforce data isolation

### Credential Storage

**Kite API Credentials**:
- Stored in database (`accounts` table)
- Encrypted at rest (if database encryption enabled)
- User-specific and isolated
- Access tokens expire daily

**User Passwords**:
- Hashed with bcrypt
- Never stored in plain text
- Cost factor 10 for security/performance balance

### Data Encryption

- **In Transit**: HTTPS/TLS for all communications
- **At Rest**: Database encryption (if enabled)
- **Sensitive Fields**: API secrets stored securely

## Error Handling

### Error Response Standards

**Consistent Error Format**:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message (optional)"
}
```

**Status Code Guidelines**:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Authorization failed
- `404 Not Found`: Resource not found or no access
- `500 Internal Server Error`: Server error

### Error Pages

**404 Not Found** (`app/not-found.tsx`):
- Shown when resource doesn't exist
- User-friendly error page
- Navigation options

**403 Forbidden** (`app/forbidden.tsx`):
- Shown when user lacks permission
- Clear error message
- Navigation options

### Security Through Obscurity

- Resources that don't exist or user doesn't own return `404`
- Prevents information disclosure about resource existence
- Users can't enumerate resources they don't own

## Best Practices

### Development

1. **Always validate server-side**: Client-side validation is for UX only
2. **Use auth utilities**: Use `lib/auth.ts` functions for consistency
3. **Return proper status codes**: Use appropriate HTTP status codes
4. **Log security events**: Log authentication failures and authorization denials
5. **Test authorization**: Test that users can't access others' resources

### Deployment

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Cookies**: Use secure, HTTP-only cookies
3. **Environment Variables**: Never commit secrets to version control
4. **Database Security**: Use strong passwords and restrict access
5. **Regular Updates**: Keep dependencies updated for security patches

### Monitoring

1. **Authentication Failures**: Monitor failed login attempts
2. **Authorization Denials**: Monitor 403 responses
3. **Unusual Access Patterns**: Monitor for suspicious activity
4. **Error Rates**: Monitor error rates for potential attacks

## Security Checklist

- [x] All routes protected except public ones
- [x] Server-side authentication validation
- [x] Server-side authorization validation
- [x] User data isolation enforced
- [x] Proper HTTP status codes (401, 403, 404)
- [x] SQL injection prevention (prepared statements)
- [x] Password hashing (bcrypt)
- [x] Secure session management (JWT)
- [x] Error pages for 404 and 403
- [x] Resource ownership validation
- [ ] Rate limiting (TODO)
- [ ] CSRF protection (TODO)
- [ ] Security headers (TODO)
- [ ] Input sanitization (TODO)
- [ ] Security audit logging (TODO)

## See Also

- [08-Special-Considerations.md](08-Special-Considerations.md) - Additional security considerations
- [02-Architecture.md](02-Architecture.md) - System architecture
- [06-Environment-Variables.md](06-Environment-Variables.md) - Secure configuration

