# File Reference

Key files and their purposes in the codebase.

## Core Application Files

### `equity/app/layout.tsx`
Root layout for Next.js application. Includes Navigation and Providers.

### `equity/app/page.tsx`
Home page (redirects to dashboard).

### `equity/middleware.ts`
Next.js middleware for authentication and route protection.

### `equity/app/providers.tsx`
Client-side providers (SessionProvider for NextAuth).

## Database Files

### `equity/lib/db.ts`
Database connection pool and query helpers for equity module. Defines TypeScript interfaces for User, Account, Trade, Ledger, ImportConflict.

### `equity/lib/balancesheet-db.ts`
Database helpers for balance sheet module. Defines interfaces for BSCategory, BSBank, BSTransaction, BSRecurring.

## Service Files

### `equity/lib/kite-service.ts`
Kite Connect API service wrapper. Manages sessions, loads credentials from database, executes Kite tools.

### `equity/lib/xirr-calculator.ts`
XIRR calculation functions using `xirr` library. Portfolio-level and stock-level XIRR.

### `equity/lib/yahoo-finance.ts`
Yahoo Finance API service for free stock price fetching.

### `equity/lib/auth.ts`
Authentication helpers: `getCurrentUser`, `requireAuth`, `requireAdmin`, `checkResourceOwnership`.

## API Route Files

### `equity/app/api/auth/[...nextauth]/route.ts`
NextAuth.js configuration with Credentials and Google OAuth providers.

### `equity/app/api/register/route.ts`
User registration with email verification.

### `equity/app/api/accounts/route.ts`
Account CRUD operations.

### `equity/app/api/trades/route.ts`
Trade CRUD operations.

### `equity/app/api/stats/route.ts`
Portfolio statistics with XIRR calculations.

### `equity/app/api/kite/execute/route.ts`
Kite tool execution endpoint.

### `equity/app/api/import/tradebook/route.ts`
Tradebook CSV import with conflict detection.

### `equity/app/api/import/ledger/route.ts`
Ledger CSV import with conflict detection.

### `equity/app/api/conflicts/route.ts`
Import conflict management.

## Component Files

### `equity/components/Navigation.tsx`
Main navigation menu with accordion sections. Client Component.

## State Management

### `equity/store/useKiteStore.ts`
Zustand store for Kite account data and consolidation.

## MCP Server Files

### `src/index.ts`
Main MCP server implementation. Handles all MCP tool requests.

### `src/config.ts`
Configuration loader for multi-account Kite setup.

## Configuration Files

### `equity/next.config.mjs`
Next.js configuration with webpack aliases.

### `equity/tsconfig.json`
TypeScript configuration for Next.js application.

### `equity/eslint.config.mjs`
ESLint configuration with Next.js rules.

## Migration Scripts

### `equity/scripts/migrate-users-table.sql`
Creates users table and default admin user.

### `equity/scripts/migrate-accounts-user-id.sql`
Adds user_id to accounts table.

### `equity/scripts/migrate-kite-credentials-to-db.sql`
Adds API credential columns to accounts table.

### `equity/scripts/setup-balancesheet.sql`
Creates balance sheet tables.

### `equity/scripts/migrate-banks-schema.sql`
Updates banks table schema.

