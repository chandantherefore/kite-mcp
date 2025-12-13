# Authentication System Setup Guide

This guide explains how to set up and use the authentication system for the Kite Portfolio Manager application.

## Features

- **User Registration**: Users can register with username, email, password, and profile information
- **Email Verification**: Email verification required for credential-based login
- **Google OAuth**: Users can sign in with Google (auto-verified, no email confirmation needed)
- **Role-Based Access Control**: User and Admin roles with protected routes
- **Admin Portal**: Manage users, toggle active status, change roles, and delete users

## Prerequisites

1. **MySQL Database**: Ensure your database is running and accessible
2. **Resend Account**: Sign up at [resend.com](https://resend.com) for email functionality
3. **Google OAuth Credentials**: (Optional) Set up OAuth credentials in Google Cloud Console

## Installation Steps

### 1. Database Setup

Run the migration script to create the users table:

```bash
mysql -u db -p oneapp < scripts/migrate-users-table.sql
```

This creates:
- `users` table with all required fields
- Default admin user (username: `admin`, password: `admin123`)

### 2. Environment Variables

Copy `env.example.txt` to `.env.local` and configure:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=db
DATABASE_PASSWORD=db
DATABASE_NAME=oneapp

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here
PORT=3000

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (Resend)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 3. Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Copy Client ID and Client Secret to `.env.local`

### 4. Resend Email Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use `onboarding@resend.dev` for testing)
3. Generate API key
4. Add to `.env.local` as `RESEND_API_KEY`

### 5. Install Dependencies

Dependencies are already installed if you followed the implementation. If not:

```bash
cd equity
npm install next-auth bcryptjs resend
```

### 6. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## Usage

### For Users

1. **Register**:
   - Go to `/register`
   - Fill in all required fields
   - Submit the form
   - Check your email for verification link
   - Click the link to activate your account

2. **Login with Credentials**:
   - Go to `/login`
   - Enter email and password
   - Click "Sign In"

3. **Login with Google**:
   - Go to `/login`
   - Click "Sign in with Google"
   - Authorize with Google
   - Automatically logged in (no email verification needed)

### For Admins

**Default Admin Credentials**:
- Username: `admin`
- Email: `admin@kite.local`
- Password: `admin123`

**Admin Portal** (`/admin`):
- View user statistics
- Manage all users
- Toggle user active/inactive status
- Change user roles (user ↔ admin)
- Delete users

**User Management** (`/admin/users`):
- View all registered users
- See user details (expertise, status, auth method)
- Activate/Deactivate users
- Promote users to admin or demote to regular user
- Delete user accounts (cannot delete self)

## Security Features

- Passwords are hashed with bcryptjs (10 rounds)
- Email verification tokens expire after 24 hours
- JWT-based session management
- Protected routes with middleware
- Role-based authorization
- SQL injection prevention (parameterized queries)

## File Structure

```
equity/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # NextAuth configuration
│   │   ├── register/
│   │   │   └── route.ts              # Registration endpoint
│   │   ├── verify-email/
│   │   │   └── route.ts              # Email verification endpoint
│   │   └── admin/
│   │       └── users/
│   │           └── route.ts          # Admin user management API
│   ├── register/
│   │   └── page.tsx                  # Registration page
│   ├── login/
│   │   └── page.tsx                  # Login page
│   ├── verify-email/
│   │   └── page.tsx                  # Email verification page
│   ├── admin/
│   │   ├── page.tsx                  # Admin dashboard
│   │   └── users/
│   │       └── page.tsx              # User management page
│   ├── providers.tsx                 # NextAuth SessionProvider wrapper
│   └── layout.tsx                    # Root layout with providers
├── components/
│   └── Navigation.tsx                # Updated with auth links
├── lib/
│   └── db.ts                         # Database helpers (includes user methods)
├── middleware.ts                     # Route protection middleware
└── scripts/
    └── migrate-users-table.sql       # Database migration
```

## API Endpoints

### Public Endpoints
- `POST /api/register` - User registration
- `POST /api/verify-email` - Email verification
- `POST /api/auth/signin` - NextAuth sign in
- `GET /api/auth/session` - Get session

### Protected Endpoints (Admin Only)
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users` - Update user (toggle active, change role)
- `DELETE /api/admin/users?userId={id}` - Delete user

## Troubleshooting

### Email Verification Not Working
- Check Resend API key is correct
- Verify `EMAIL_FROM` matches your verified domain
- Check spam folder
- For testing, use `onboarding@resend.dev` as `EMAIL_FROM`

### Google Login Not Working
- Verify OAuth credentials are correct
- Check authorized redirect URIs include your domain
- Ensure Google+ API is enabled
- Check browser console for errors

### Cannot Access Admin Portal
- Verify your user has `role = 'admin'` in database
- Check session includes role (logout and login again)
- Ensure middleware.ts is in the correct location

### Database Connection Issues
- Verify database credentials in `.env.local`
- Check MySQL is running
- Ensure database `oneapp` exists
- Verify users table was created

## Production Deployment

1. **Environment Variables**:
   - Generate strong `NEXTAUTH_SECRET`
   - Update `NEXTAUTH_URL` to production domain
   - Use production Google OAuth credentials
   - Configure production email domain

2. **Security**:
   - Change default admin password immediately
   - Use HTTPS only
   - Enable rate limiting
   - Monitor logs for suspicious activity

3. **Database**:
   - Use connection pooling
   - Enable SSL for database connections
   - Regular backups

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Check browser console for errors
4. Review server logs

## License

Same as the main project.

