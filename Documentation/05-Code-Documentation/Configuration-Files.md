# Configuration Files

## Root Configuration

### package.json

**Location**: `package.json`

**Purpose**: MCP Server dependencies and scripts

**Key Scripts**:
- `build` - Compile TypeScript
- `dev` - Watch mode
- `start` - Run server

**Type**: Module (ESM)

### tsconfig.json

**Location**: `tsconfig.json`

**Purpose**: TypeScript configuration for MCP server

**Key Settings**:
- Target: ES2022
- Module: Node16
- Strict mode enabled

## Equity Application Configuration

### package.json

**Location**: `equity/package.json`

**Purpose**: Next.js application dependencies

**Key Scripts**:
- `dev` - Development server
- `build` - Production build
- `start` - Production server
- `lint` - Run ESLint

### tsconfig.json

**Location**: `equity/tsconfig.json`

**Purpose**: TypeScript configuration for Next.js

**Key Settings**:
- Target: ES2017
- Module: ESNext
- JSX: preserve
- Path aliases: `@/*`, `@server/*`

### next.config.mjs

**Location**: `equity/next.config.mjs`

**Purpose**: Next.js configuration

**Features**:
- Webpack alias for `@server` (MCP server)

### eslint.config.mjs

**Location**: `equity/eslint.config.mjs`

**Purpose**: ESLint configuration

**Features**:
- Next.js ESLint config
- TypeScript support
- Core web vitals

### postcss.config.mjs

**Location**: `equity/postcss.config.mjs`

**Purpose**: PostCSS configuration

**Plugins**:
- Tailwind CSS

## Environment Files

### env.example

**Location**: `env.example`

**Purpose**: MCP server environment template

**Variables**:
- `KITE_ACC_{N}_ID`
- `KITE_ACC_{N}_NAME`
- `KITE_ACC_{N}_KEY`
- `KITE_ACC_{N}_SECRET`

### equity/env.example.txt

**Location**: `equity/env.example.txt`

**Purpose**: Next.js application environment template

**Variables**:
- Database: `DATABASE_*`
- NextAuth: `NEXTAUTH_*`
- Google OAuth: `GOOGLE_*`
- Resend: `RESEND_*`
- Kite: `KITE_ACC_*` (optional)

## Configuration Details

### Database Configuration

**Location**: `equity/lib/db.ts`

```typescript
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'db',
  password: process.env.DATABASE_PASSWORD || 'db',
  database: process.env.DATABASE_NAME || 'oneapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
```

### NextAuth Configuration

**Location**: `equity/app/api/auth/[...nextauth]/route.ts`

**Key Settings**:
- Session strategy: JWT (credentials), Database (OAuth)
- Session duration: 30 days
- Providers: Credentials, Google OAuth

### Middleware Configuration

**Location**: `equity/middleware.ts`

**Features**:
- Public routes: `/login`, `/register`, `/verify-email`
- Protected routes: All others
- Admin routes: `/admin/*`

