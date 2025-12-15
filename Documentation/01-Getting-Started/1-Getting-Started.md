# Getting Started

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Project Structure](#project-structure)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: v20.x or higher (LTS recommended)
- **npm**: v10.x or higher (comes with Node.js)
- **MySQL**: v8.0 or higher
- **Git**: For version control

### Verification

Check your installations:

```bash
node --version  # Should be v20.x or higher
npm --version   # Should be v10.x or higher
mysql --version # Should be v8.0 or higher
```

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd one-app
```

### 2. Install Dependencies

#### Root MCP Server

```bash
npm install
```

This installs dependencies for the MCP server (`src/` directory).

#### Equity Web Application

```bash
cd equity
npm install
```

This installs dependencies for the Next.js application.

### 3. Database Setup

#### 3.1. Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE oneapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### 3.2. Run Migration Scripts

Run the following scripts **in order**:

```bash
# Navigate to equity directory
cd equity

# Run migrations in sequence
mysql -u root -p oneapp < scripts/migrate-users-table.sql
mysql -u root -p oneapp < scripts/migrate-accounts-user-id.sql
mysql -u root -p oneapp < scripts/migrate-kite-credentials-to-db.sql
mysql -u root -p oneapp < scripts/setup-balancesheet.sql
mysql -u root -p oneapp < scripts/migrate-banks-schema.sql
```

**Migration Order:**
1. `migrate-users-table.sql` - Creates users table and default admin user
2. `migrate-accounts-user-id.sql` - Adds user_id to accounts table
3. `migrate-kite-credentials-to-db.sql` - Adds API credential columns to accounts
4. `setup-balancesheet.sql` - Creates balance sheet tables (bs_categories, bs_banks, bs_transactions, bs_recurring)
5. `migrate-banks-schema.sql` - Updates banks table schema (removes owner, adds IFSC, account_name, account_number)

**Note**: If you need long-lasting sessions (30 days), also run:
```bash
mysql -u root -p oneapp < scripts/migrate-nextauth-sessions.sql
```

#### 3.3. Verify Database Setup

```bash
mysql -u root -p oneapp -e "SHOW TABLES;"
```

You should see tables: `users`, `accounts`, `trades`, `ledger`, `import_conflicts`, `bs_categories`, `bs_banks`, `bs_transactions`, `bs_recurring`.

### 4. Environment Configuration

#### 4.1. Root MCP Server Environment

**File**: `.env` (create from `env.example`)

```bash
cp env.example .env
```

**Variables** (for MCP server running standalone):

```properties
# Kite Connect Account Configuration
# Format: KITE_ACC_{N}_ID, KITE_ACC_{N}_NAME, KITE_ACC_{N}_KEY, KITE_ACC_{N}_SECRET

KITE_ACC_1_ID=your_account_id
KITE_ACC_1_NAME=Account Display Name
KITE_ACC_1_KEY=your_api_key
KITE_ACC_1_SECRET=your_api_secret

# Add more accounts by incrementing N
KITE_ACC_2_ID=...
KITE_ACC_2_NAME=...
KITE_ACC_2_KEY=...
KITE_ACC_2_SECRET=...
```

**Note**: The web application stores Kite credentials in the database. These environment variables are only needed if running the MCP server separately.

#### 4.2. Equity Web Application Environment

**File**: `equity/.env.local` (create from `equity/env.example.txt`)

```bash
cd equity
cp env.example.txt .env.local
```

**Required Variables**:

```properties
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=db
DATABASE_PASSWORD=db
DATABASE_NAME=oneapp

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-change-this-in-production
PORT=3000
```

**Generate NEXTAUTH_SECRET**:

```bash
openssl rand -base64 32
```

**Optional Variables**:

```properties
# Google OAuth (Required for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service (Resend) - Required for email verification
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=onboarding@yourdomain.com

# Kite Connect API (Optional - for legacy MCP server usage)
# Note: In the web app, credentials are stored in database via Settings > Accounts
KITE_ACC_1_ID=...
KITE_ACC_1_NAME=...
KITE_ACC_1_KEY=...
KITE_ACC_1_SECRET=...
```

#### 4.3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

#### 4.4. Resend Email Setup

1. Sign up at [Resend](https://resend.com/)
2. Create an API key
3. Verify your domain or use Resend's test domain
4. Set `EMAIL_FROM` to a verified email address

## Environment Variables Reference

### Local Development

All variables are defined in `equity/.env.local`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_HOST` | No | `localhost` | MySQL database host |
| `DATABASE_PORT` | No | `3306` | MySQL database port |
| `DATABASE_USER` | No | `db` | MySQL database username |
| `DATABASE_PASSWORD` | No | `db` | MySQL database password |
| `DATABASE_NAME` | No | `oneapp` | MySQL database name |
| `NEXTAUTH_URL` | Yes | - | Base URL (http://localhost:3000 for local) |
| `NEXTAUTH_SECRET` | Yes | - | Secret key for JWT encryption |
| `PORT` | No | `3000` | Next.js development server port |
| `GOOGLE_CLIENT_ID` | No* | - | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | No* | - | Google OAuth Client Secret |
| `RESEND_API_KEY` | No* | - | Resend API key for emails |
| `EMAIL_FROM` | No* | - | Email address to send from |

*Required only if using Google OAuth or email verification.

### Cloud/Production Environment

For production deployment, use the same variables but with production values:

```properties
# Database (Production)
DATABASE_HOST=your-production-db-host
DATABASE_PORT=3306
DATABASE_USER=production_user
DATABASE_PASSWORD=strong_production_password
DATABASE_NAME=oneapp

# NextAuth (Production)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=production-secret-min-32-chars
PORT=3000

# Google OAuth (Production)
GOOGLE_CLIENT_ID=production-google-client-id
GOOGLE_CLIENT_SECRET=production-google-client-secret
# Redirect URI: https://yourdomain.com/api/auth/callback/google

# Email (Production)
RESEND_API_KEY=production-resend-key
EMAIL_FROM=noreply@yourdomain.com
```

**Production Security Notes**:
- Use strong, unique secrets
- Never commit `.env` files
- Use environment variable management (AWS Secrets Manager, HashiCorp Vault, etc.)
- Enable HTTPS (NEXTAUTH_URL must use https://)
- Use secure database credentials
- Restrict database access by IP

### Storybook (Not Currently Configured)

Storybook is not currently set up in this project. If you need to add it:

1. Install Storybook: `npx storybook@latest init`
2. Create `.storybook/main.ts` configuration
3. Add environment variables if needed in `.env.storybook`

## Running the Application

### Development Mode

#### MCP Server (Root)

```bash
# Build TypeScript
npm run build

# Run in watch mode
npm run dev

# Or run directly
npm start
```

#### Web Application (Equity)

```bash
cd equity

# Development server
npm run dev

# Application will be available at http://localhost:3000
```

### Production Build

```bash
cd equity

# Build the application
npm run build

# Start production server
npm start
```

### Verification Script

Run the setup verification script:

```bash
./verify-setup.sh
```

This checks:
- DDEV installation (if using DDEV)
- Docker status
- Database connectivity
- Node modules
- Application accessibility

## Project Structure

```
one-app/
├── .ai/
│   └── prompts/              # AI workflow prompts
├── Documentation/            # Project documentation
├── equity/                   # Next.js web application
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API routes
│   │   ├── admin/            # Admin pages
│   │   ├── balancesheet/     # Balance sheet pages
│   │   ├── dashboard/        # Dashboard page
│   │   └── ...               # Other pages
│   ├── lib/                  # Core libraries
│   │   ├── db.ts             # Database operations (equity)
│   │   ├── balancesheet-db.ts # Database operations (balance sheet)
│   │   ├── auth.ts           # Authentication helpers
│   │   ├── kite-service.ts   # Kite API integration
│   │   ├── xirr-calculator.ts # XIRR calculations
│   │   └── yahoo-finance.ts  # Yahoo Finance price fetching
│   ├── components/           # React components
│   ├── scripts/             # Database migration scripts
│   ├── store/               # Zustand state management
│   ├── middleware.ts        # Next.js middleware (auth)
│   ├── package.json         # Dependencies
│   └── .env.local           # Environment variables (local)
├── src/                      # MCP Server source code
│   ├── index.ts             # Main MCP server
│   └── config.ts            # Configuration loader
├── package.json             # Root package.json (MCP server)
├── env.example              # MCP server env template
└── README.md                # Project README
```

## Troubleshooting

### Database Connection Issues

**Error**: "Cannot connect to database"

**Solutions**:
1. Verify MySQL is running: `mysql -u root -p`
2. Check environment variables in `equity/.env.local`
3. Verify database exists: `SHOW DATABASES;`
4. Test connection: `mysql -u db -p oneapp`

### Authentication Issues

**Error**: "NEXTAUTH_SECRET is missing"

**Solution**:
```bash
openssl rand -base64 32
# Add output to NEXTAUTH_SECRET in .env.local
```

**Error**: "Google OAuth not working"

**Solutions**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
2. Check redirect URI in Google Cloud Console matches: `http://localhost:3000/api/auth/callback/google`
3. Ensure `NEXTAUTH_URL` is correct

### Email Verification Not Working

**Error**: "Email not sending"

**Solutions**:
1. Verify `RESEND_API_KEY` is set
2. Check `EMAIL_FROM` is a verified email in Resend
3. Check Resend dashboard for errors
4. Email verification is optional - users can still login if not configured

### Kite API Issues

**Error**: "Cannot find API credentials"

**Solutions**:
1. For web app: Go to Settings > Accounts and add API keys through UI
2. For MCP server: Check environment variables match pattern `KITE_ACC_{N}_*`
3. Verify API keys are valid in Zerodha Developer Console

### Port Already in Use

**Error**: "Port 3000 is already in use"

**Solutions**:
1. Change `PORT` in `.env.local` to another port (e.g., 3001)
2. Or stop the process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill
   ```

### Migration Errors

**Error**: "Table already exists"

**Solutions**:
1. Check if tables already exist: `SHOW TABLES;`
2. If re-running migrations, you may need to drop tables first (be careful!)
3. Or use `CREATE TABLE IF NOT EXISTS` (already in scripts)

### Module Not Found Errors

**Error**: "Cannot find module"

**Solutions**:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check Node.js version: `node --version` (should be v20+)
3. Clear npm cache: `npm cache clean --force`

## Next Steps

After setup:

1. **Access the application**: http://localhost:3000
2. **Login**: Use default admin credentials:
   - Email: `admin@kite.local`
   - Password: `admin123`
3. **Add Accounts**: Go to Settings > Accounts to add trading accounts
4. **Import Data**: Go to Import page to upload tradebook and ledger CSV files
5. **View Portfolio**: Check Dashboard and Holdings pages

## Additional Resources

- **Architecture**: See `Documentation/2-Architectural/`
- **Data Models**: See `Documentation/3-Data-Module/`
- **Business Requirements**: See `Documentation/4-Business-Requirements/`
- **Code Documentation**: See `Documentation/5-Code-Documentation/`

