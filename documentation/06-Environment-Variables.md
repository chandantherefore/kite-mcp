# Environment Variables

## Table of Contents

1. [Overview](#overview)
2. [MCP Server Environment Variables](#mcp-server-environment-variables)
3. [Portfolio Manager Environment Variables](#portfolio-manager-environment-variables)
4. [Environment Setup](#environment-setup)
5. [Security Best Practices](#security-best-practices)
6. [Gap Identification](#gap-identification)

## Overview

The project uses environment variables for configuration, with separate configurations for the MCP Server and the Portfolio Manager web application.

**Important**: Never commit environment files with actual credentials to version control. Always use `.env.example` files as templates.

## MCP Server Environment Variables

**Location**: `env.example` (root directory)

### Kite Connect Account Configuration

The MCP Server supports multiple Kite Connect accounts through numbered environment variables.

#### Account 1

```bash
KITE_ACC_1_ID=father
KITE_ACC_1_NAME=Dad's Portfolio
KITE_ACC_1_KEY=your_api_key_here
KITE_ACC_1_SECRET=your_api_secret_here
```

#### Account 2

```bash
KITE_ACC_2_ID=mother
KITE_ACC_2_NAME=Mom's Portfolio
KITE_ACC_2_KEY=your_api_key_here
KITE_ACC_2_SECRET=your_api_secret_here
```

#### Additional Accounts

Add more accounts by incrementing the number:

```bash
KITE_ACC_3_ID=account3
KITE_ACC_3_NAME=Another Account
KITE_ACC_3_KEY=your_api_key_here
KITE_ACC_3_SECRET=your_api_secret_here
```

### Variable Descriptions

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `KITE_ACC_{N}_ID` | Yes | Unique account identifier (alphanumeric, no spaces) | `father`, `mother`, `account1` |
| `KITE_ACC_{N}_NAME` | No | Display name for the account (defaults to ID if not provided) | `Dad's Portfolio` |
| `KITE_ACC_{N}_KEY` | Yes | Kite Connect API Key from Zerodha Developer Console | `abc123xyz` |
| `KITE_ACC_{N}_SECRET` | Yes | Kite Connect API Secret from Zerodha Developer Console | `secret123` |

### How It Works

1. The MCP Server loads all accounts matching the pattern `KITE_ACC_{N}_*`
2. Accounts are numbered starting from 1
3. The system stops loading when it encounters a missing `ID`, `KEY`, or `SECRET`
4. Account credentials are loaded from environment variables or can be provided at runtime via tool parameters

### Credential Storage

- **Location**: `~/.kite-mcp-credentials.json`
- **Format**: JSON object with account IDs as keys
- **Content**: API keys, secrets, and access tokens
- **Security**: File permissions should be restricted (600)

## Portfolio Manager Environment Variables

**Location**: `equity/env.example.txt`

### Database Configuration

```bash
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=db
DATABASE_PASSWORD=db
DATABASE_NAME=oneapp
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_HOST` | No | `localhost` | MySQL database host |
| `DATABASE_PORT` | No | `3306` | MySQL database port |
| `DATABASE_USER` | No | `db` | MySQL database username |
| `DATABASE_PASSWORD` | No | `db` | MySQL database password |
| `DATABASE_NAME` | No | `oneapp` | MySQL database name |

### NextAuth Configuration

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-change-this-in-production
PORT=3000
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXTAUTH_URL` | Yes | - | Base URL of the application (used for OAuth callbacks) |
| `NEXTAUTH_SECRET` | Yes | - | Secret key for JWT encryption (generate a random string) |
| `PORT` | No | `3000` | Port for Next.js development server |

**Note**: `NEXTAUTH_SECRET` should be a long, random string. Generate one using:
```bash
openssl rand -base64 32
```

### Google OAuth Configuration

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | No* | Google OAuth Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | No* | Google OAuth Client Secret from Google Cloud Console |

*Required only if Google OAuth is enabled. If not provided, Google sign-in will be disabled.

**Setup Instructions**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret

### Email Configuration (Resend)

```bash
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=onboarding@yourdomain.com
```

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | No* | Resend API key for sending emails |
| `EMAIL_FROM` | No* | Email address to send from (must be verified in Resend) |

*Required only if email verification is enabled. If not provided, email verification will be disabled.

**Setup Instructions**:
1. Sign up at [Resend](https://resend.com/)
2. Create an API key
3. Verify your domain or use Resend's test domain
4. Set `EMAIL_FROM` to a verified email address

### Kite Connect API Configuration

**Note**: As of the latest version, Kite Connect API credentials are managed through the database (Accounts page) rather than environment variables. Users can add their API keys and secrets directly through the web interface at Settings > Accounts.

The MCP Server (if running separately) still uses environment variables for its configuration. See [MCP Server Environment Variables](#mcp-server-environment-variables) above.

## Environment Setup

### Development Environment

1. **Copy example files**:
   ```bash
   # For MCP Server
   cp env.example .env
   
   # For Portfolio Manager
   cd equity
   cp env.example.txt .env.local
   ```

2. **Fill in values**:
   - Replace placeholder values with actual credentials
   - Generate `NEXTAUTH_SECRET` using `openssl rand -base64 32`
   - Obtain Kite Connect API keys from Zerodha Developer Console
   - Set up Google OAuth if needed
   - Configure Resend for email if needed

3. **Verify configuration**:
   - Check that all required variables are set
   - Verify database connection
   - Test authentication flows

### Production Environment

<!-- TODO: [GAP] Add production environment setup instructions -->

**Important Production Considerations**:
- Use strong, unique values for all secrets
- Never commit `.env` files to version control
- Use environment variable management tools (e.g., AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Use different credentials for production and development
- Enable HTTPS (NEXTAUTH_URL should use https://)
- Use secure database credentials
- Restrict database access by IP if possible

## Security Best Practices

### 1. Credential Management

- **Never commit secrets**: Always use `.env.example` files
- **Use strong secrets**: Generate random strings for `NEXTAUTH_SECRET`
- **Rotate regularly**: Change secrets periodically
- **Separate environments**: Use different credentials for dev/staging/prod

### 2. File Permissions

- **Credentials file**: Restrict permissions on `~/.kite-mcp-credentials.json`
  ```bash
  chmod 600 ~/.kite-mcp-credentials.json
  ```

### 3. Environment Variable Security

- **Don't log secrets**: Never log environment variables containing secrets
- **Use secure storage**: In production, use secret management services
- **Validate inputs**: Always validate environment variable values

### 4. Database Security

- **Strong passwords**: Use complex database passwords
- **Restrict access**: Limit database access to application servers only
- **Use SSL**: Enable SSL for database connections in production
- **Regular backups**: Implement regular database backups

### 5. OAuth Security

- **Authorized redirects**: Only add trusted redirect URIs
- **HTTPS only**: Use HTTPS in production for OAuth callbacks
- **Token storage**: Tokens are stored securely by NextAuth.js

### 6. API Key Security

- **Kite Connect API**: Keep API keys and secrets secure
- **Access tokens**: Access tokens are stored in `~/.kite-mcp-credentials.json`
- **Token expiration**: Kite access tokens expire at end of trading day

## Environment Variable Validation

### MCP Server

The MCP Server validates:
- At least one account must be configured
- Each account must have `ID`, `KEY`, and `SECRET`
- Account IDs must be unique

### Portfolio Manager

The Portfolio Manager validates:
- Database connection on startup
- NextAuth configuration (URL and secret)
- Optional services (Google OAuth, Resend) if configured

## Troubleshooting

### Common Issues

1. **"Cannot find API credentials"**
   - Check that environment variables are set correctly
   - Verify variable names match the pattern `KITE_ACC_{N}_*`
   - Ensure no typos in variable names

2. **"Database connection failed"**
   - Verify database is running
   - Check `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`
   - Ensure database exists: `CREATE DATABASE oneapp;`

3. **"NEXTAUTH_SECRET is missing"**
   - Generate a secret: `openssl rand -base64 32`
   - Add to `.env.local` file

4. **"Google OAuth not working"**
   - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
   - Check redirect URI matches in Google Cloud Console
   - Ensure `NEXTAUTH_URL` is correct

5. **"Email not sending"**
   - Verify `RESEND_API_KEY` is set
   - Check `EMAIL_FROM` is a verified email in Resend
   - Check Resend dashboard for errors

## Gap Identification

The following areas require additional environment variable documentation:

1. **Production Environment Setup**: Detailed production environment configuration
2. **Docker Configuration**: Environment variables for Docker containers
3. **Kubernetes Configuration**: Environment variables for Kubernetes deployments
4. **CI/CD Configuration**: Environment variables for CI/CD pipelines
5. **Secret Management**: Integration with secret management services (AWS Secrets Manager, etc.)
6. **Environment-Specific Configs**: Different configurations for dev/staging/prod
7. **Validation Scripts**: Scripts to validate environment variable configuration
8. **Monitoring**: Environment variable monitoring and alerting

See also: [08-Special-Considerations.md](08-Special-Considerations.md) for security considerations.

