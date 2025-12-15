# Library Usage

How each major library is used in the application.

## Next.js

**Usage**: Web framework with App Router

**Key Features Used**:
- Server Components (default)
- Client Components (`'use client'`)
- API Routes (Route Handlers)
- Middleware for authentication
- Server-side data fetching

**Example**:
```typescript
// Server Component
export default async function Page() {
  const data = await db.getData();
  return <div>{data}</div>;
}

// API Route
export async function GET() {
  return NextResponse.json({ data });
}
```

## React

**Usage**: UI library

**Key Features Used**:
- Server Components (Next.js)
- Client Components with hooks
- Server Actions (if used)

**Example**:
```typescript
'use client';

import { useState, useEffect } from 'react';

export default function Component() {
  const [state, setState] = useState();
  // ...
}
```

## NextAuth.js

**Usage**: Authentication library

**Configuration**: `equity/app/api/auth/[...nextauth]/route.ts`

**Providers**:
- Credentials (email/password)
- Google OAuth

**Session Strategy**:
- JWT for credentials
- Database for OAuth

**Usage**:
```typescript
import { getServerSession } from 'next-auth';
import { useSession } from 'next-auth/react';

// Server
const session = await getServerSession(authOptions);

// Client
const { data: session } = useSession();
```

## mysql2

**Usage**: MySQL client with connection pooling

**Location**: `equity/lib/db.ts`

**Features Used**:
- Connection pooling (10 connections)
- Prepared statements
- Transactions

**Example**:
```typescript
import { query, insert, transaction } from '@/lib/db';

const rows = await query('SELECT * FROM users WHERE id = ?', [userId]);
const id = await insert('INSERT INTO users ...', [values]);
await transaction(async (conn) => {
  // Multiple operations
});
```

## KiteConnect

**Usage**: Zerodha Kite Connect SDK

**Location**: `equity/lib/kite-service.ts`, `src/index.ts`

**Features Used**:
- Authentication (login, generate session)
- Market data (quotes, OHLC, historical)
- Portfolio (holdings, positions, margins)
- Trading (place, modify, cancel orders)

**Example**:
```typescript
import { executeKiteTool } from '@/lib/kite-service';

const holdings = await executeKiteTool('get_holdings', {
  account_id: 1,
  user_id: 1
});
```

## Zustand

**Usage**: State management for client-side data

**Location**: `equity/store/useKiteStore.ts`

**Features Used**:
- Store for Kite account data
- Consolidation helpers

**Example**:
```typescript
import { useKiteStore } from '@/store/useKiteStore';

const { accountData, setAccountData } = useKiteStore();
```

## Tailwind CSS

**Usage**: Utility-first CSS framework

**Configuration**: `equity/postcss.config.mjs`

**Usage**: Utility classes throughout components

**Example**:
```tsx
<div className="bg-white shadow-sm border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4">
    {/* ... */}
  </div>
</div>
```

## csv-parse

**Usage**: CSV file parsing

**Location**: `equity/app/api/import/*/route.ts`

**Example**:
```typescript
import { parse } from 'csv-parse/sync';

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true
});
```

## xirr

**Usage**: XIRR calculation library

**Location**: `equity/lib/xirr-calculator.ts`

**Example**:
```typescript
import { calculateXIRR } from 'xirr';

const cashFlows = [
  { amount: -10000, when: new Date('2020-01-01') },
  { amount: 12000, when: new Date('2021-01-01') }
];

const xirr = calculateXIRR(cashFlows);
```

## bcryptjs

**Usage**: Password hashing

**Location**: `equity/app/api/register/route.ts`, `equity/app/api/auth/[...nextauth]/route.ts`

**Example**:
```typescript
import bcrypt from 'bcryptjs';

const hashed = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashed);
```

## Resend

**Usage**: Email service API

**Location**: `equity/app/api/register/route.ts`

**Example**:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: process.env.EMAIL_FROM,
  to: email,
  subject: 'Verify your email',
  html: emailContent
});
```

