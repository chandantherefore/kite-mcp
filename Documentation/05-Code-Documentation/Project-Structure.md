# Project Structure

## Root Directory

```
one-app/
├── .ai/
│   └── prompts/              # AI workflow prompts
├── Documentation/            # Project documentation
├── equity/                   # Next.js web application
├── src/                      # MCP Server source code
├── package.json              # Root package.json (MCP server)
├── tsconfig.json             # Root TypeScript config
├── env.example               # MCP server env template
└── README.md                 # Project README
```

## Equity Application (`equity/`)

```
equity/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── accounts/         # Account management
│   │   ├── admin/            # Admin operations
│   │   ├── auth/             # Authentication
│   │   ├── balancesheet/     # Balance sheet APIs
│   │   ├── conflicts/        # Import conflicts
│   │   ├── import/           # CSV import
│   │   ├── kite/             # Kite integration
│   │   ├── stats/            # Portfolio statistics
│   │   └── tools/            # Utility tools
│   ├── admin/                # Admin pages
│   ├── balancesheet/         # Balance sheet pages
│   ├── dashboard/            # Dashboard page
│   ├── holdings/             # Holdings page
│   ├── import/               # Import page
│   ├── settings/             # Settings pages
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── providers.tsx          # Client providers
├── components/                # React components
│   ├── Navigation.tsx         # Main navigation
│   └── PageShortcuts.tsx     # Page shortcuts
├── lib/                       # Core libraries
│   ├── auth.ts               # Auth helpers
│   ├── db.ts                 # Database (equity)
│   ├── balancesheet-db.ts    # Database (balance sheet)
│   ├── kite-service.ts       # Kite API service
│   ├── xirr-calculator.ts    # XIRR calculations
│   └── yahoo-finance.ts      # Yahoo Finance API
├── scripts/                   # Database migrations
│   ├── migrate-users-table.sql
│   ├── migrate-accounts-user-id.sql
│   ├── migrate-kite-credentials-to-db.sql
│   ├── setup-balancesheet.sql
│   └── migrate-banks-schema.sql
├── store/                     # State management
│   └── useKiteStore.ts       # Zustand store
├── middleware.ts              # Next.js middleware
├── package.json               # Dependencies
├── tsconfig.json             # TypeScript config
├── next.config.mjs           # Next.js config
├── eslint.config.mjs         # ESLint config
└── .env.local                 # Environment variables
```

## MCP Server (`src/`)

```
src/
├── index.ts                   # Main MCP server
└── config.ts                  # Configuration loader
```

## Key Directories

### `app/` - Next.js App Router

- **Pages**: Server Components by default
- **API Routes**: Route handlers for backend functionality
- **Layouts**: Shared layouts
- **Middleware**: Route protection

### `lib/` - Core Libraries

- **Database**: Connection pooling and query helpers
- **Services**: External API integrations
- **Utilities**: Helper functions

### `components/` - React Components

- Reusable UI components
- Client Components (marked with `'use client'`)

### `scripts/` - Database Migrations

- SQL migration scripts
- Run in order for database setup

### `store/` - State Management

- Zustand stores for client-side state

## File Naming Conventions

- **Pages**: `page.tsx` (App Router)
- **API Routes**: `route.ts`
- **Layouts**: `layout.tsx`
- **Components**: PascalCase (e.g., `Navigation.tsx`)
- **Utilities**: camelCase (e.g., `kite-service.ts`)
- **Config**: kebab-case or descriptive (e.g., `next.config.mjs`)

## Import Paths

**Aliases** (configured in `tsconfig.json`):
- `@/*` → `equity/*`
- `@server/*` → `../dist/*` (MCP server)

**Usage**:
```typescript
import { db } from '@/lib/db';
import { KiteMCPServer } from '@server/index';
```

