# User Management

## Feature Description

Complete user account management system including registration, authentication, email verification, and admin operations.

## User Stories

- **As a User**, I want to register with email and password so that I can access the application.
- **As a User**, I want to login with my credentials so that I can access my portfolio.
- **As a User**, I want to login with Google so that I can skip password management.
- **As a User**, I want to verify my email so that my account is activated.
- **As an Admin**, I want to manage users so that I can control access and roles.

## Technical Implementation

### Registration

**API Route**: `POST /api/register`

**Process**:
1. Validate input (username, email, password, personal info)
2. Check for duplicate email/username
3. Hash password with bcrypt (cost factor 10)
4. Create user (is_active=false, email_verified=false)
5. Generate verification token (24-hour expiry)
6. Send verification email (if Resend configured)
7. Return success message

**Required Fields**:
- username (unique)
- email (unique, valid format)
- password (min 6 characters)
- firstName, lastName
- dob (date of birth)
- gender (enum)
- expertiseLevel (enum)

### Login

**API Route**: `POST /api/auth/signin` (NextAuth.js)

**Providers**:
1. **Credentials** (Email/Password):
   - Validate email and password
   - Check user exists and is active
   - Verify password with bcrypt
   - Return JWT session

2. **Google OAuth**:
   - Redirect to Google for authorization
   - Create user if new (auto-activate)
   - Link to existing user if email matches
   - Return database session

**Session Duration**: 30 days

### Email Verification

**API Route**: `GET /api/verify-email?token=...`

**Process**:
1. Validate token
2. Check token expiration (24 hours)
3. Activate user (is_active=true, email_verified=true)
4. Clear verification token
5. Redirect to login

**Email Service**: Resend (optional - if not configured, users can still register but must be manually activated)

### Logout

**API Route**: `GET /api/auth/signout`

**Process**:
1. Clear session cookie
2. Redirect to login page

### Admin Operations

**API Route**: `GET /api/admin/users`, `PATCH /api/admin/users`

**Features**:
- List all users (sanitized - no passwords)
- Toggle user active status
- Change user role (user/admin)
- Cannot delete own admin account

**Access Control**: Admin role required (`requireAdmin()`)

## Database Tables

- `users` - User accounts
- `sessions` - OAuth sessions (optional)
- `verification_tokens` - Email verification (optional)

## Security Features

- Password hashing (bcrypt, cost 10)
- Email verification required for new accounts
- JWT sessions (HTTP-only cookies)
- Role-based access control
- SQL injection prevention (parameterized queries)

## Files

- `equity/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `equity/app/api/register/route.ts` - Registration
- `equity/app/api/verify-email/route.ts` - Email verification
- `equity/app/api/admin/users/route.ts` - Admin operations
- `equity/app/login/page.tsx` - Login page
- `equity/app/register/page.tsx` - Registration page
- `equity/app/verify-email/page.tsx` - Email verification page
- `equity/app/admin/users/page.tsx` - Admin user management
- `equity/lib/auth.ts` - Auth helpers

