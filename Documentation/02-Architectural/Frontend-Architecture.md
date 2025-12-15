# Frontend Architecture

## Overview

The frontend is built with **Next.js 14.2.0** using the **App Router** architecture, **React 18.3.1**, and **Tailwind CSS 4**.

## Next.js App Router Structure

### Directory Structure

```
equity/app/
├── layout.tsx              # Root layout (Server Component)
├── page.tsx                # Home page
├── providers.tsx           # Client-side providers (SessionProvider)
├── globals.css             # Global styles
├── api/                    # API routes (backend)
├── dashboard/              # Dashboard page
├── holdings/               # Holdings page
├── tradebook/              # Tradebook page
├── ledger/                 # Ledger page
├── import/                 # Import page
├── balancesheet/           # Balance sheet pages
├── settings/               # Settings pages
├── admin/                  # Admin pages
└── ...                     # Other pages
```

### Server vs Client Components

**Default**: All components are **Server Components** (no `'use client'` directive)

**Client Components**: Marked with `'use client'` directive at the top

**Client Component Locations**:
- `components/Navigation.tsx` - Navigation menu with interactivity
- `app/providers.tsx` - SessionProvider wrapper
- Pages with forms, buttons, or interactive elements

**Server Component Pattern**:
```typescript
// app/dashboard/page.tsx (Server Component)
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = parseInt(session.user.id);
  const accounts = await db.getAccounts(userId);
  
  return <div>...</div>;
}
```

**Client Component Pattern**:
```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function InteractiveComponent() {
  const { data: session } = useSession();
  const [state, setState] = useState();
  
  return <div>...</div>;
}
```

## React Components

### Component Organization

**Location**: `equity/components/`

**Components**:
- `Navigation.tsx` - Main navigation menu (Client Component)
- `PageShortcuts.tsx` - Page shortcuts component

### Component Patterns

**Server Components**:
- Fetch data directly using `getServerSession` and database helpers
- No client-side JavaScript
- Better performance (no hydration)
- Can use async/await

**Client Components**:
- Use hooks (`useSession`, `useState`, `useEffect`)
- Handle user interactions
- Fetch data via API routes
- Must be marked with `'use client'`

## State Management

### Zustand Store

**Location**: `equity/store/useKiteStore.ts`

**Purpose**: Client-side state management for Kite data

**State Structure**:
```typescript
interface AccountData {
  id: string;
  name: string;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  holdings: Holding[];
  mfHoldings: MFHolding[];
  positions: { net: Position[]; day: Position[] };
  margins: Margins | null;
}
```

**Store Methods**:
- `setAccountData(accountId, data)` - Set account data
- `getAccountData(accountId)` - Get account data
- `clearAccountData(accountId)` - Clear account data
- `consolidateHoldings()` - Consolidate holdings across accounts
- `consolidateMFHoldings()` - Consolidate MF holdings

**Usage**:
```typescript
'use client';

import { useKiteStore } from '@/store/useKiteStore';

export default function Component() {
  const { accountData, setAccountData } = useKiteStore();
  // ...
}
```

### NextAuth Session State

**Location**: `equity/app/providers.tsx`

**Provider**: `SessionProvider` from `next-auth/react`

**Usage**:
```typescript
'use client';

import { useSession } from 'next-auth/react';

export default function Component() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Not logged in</div>;
  
  return <div>User: {session.user.email}</div>;
}
```

## Styling

### Tailwind CSS 4

**Configuration**: `equity/postcss.config.mjs`, `equity/globals.css`

**Usage**: Utility classes throughout components

**Example**:
```tsx
<div className="bg-white shadow-sm border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      {/* ... */}
    </div>
  </div>
</div>
```

### Icons

**Library**: `lucide-react` (v0.555.0)

**Usage**:
```tsx
import { Home, Settings, LogOut } from 'lucide-react';

<Home className="h-6 w-6" />
```

## Client-Side Patterns

### Data Fetching

**Pattern 1: Server Components (Recommended)**
```typescript
// app/page.tsx (Server Component)
import { db } from '@/lib/db';

export default async function Page() {
  const data = await db.getData();
  return <div>{data}</div>;
}
```

**Pattern 2: API Routes + Client Components**
```typescript
// app/page.tsx (Client Component)
'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return <div>{data}</div>;
}
```

### Form Handling

**Pattern**: Client Component with API route submission

```typescript
'use client';

import { useState } from 'react';

export default function Form() {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const result = await res.json();
      if (result.success) {
        // Handle success
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Authentication Checks

**Server Components**:
```typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Protected content</div>;
}
```

**Client Components**:
```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProtectedComponent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  
  return <div>Protected content</div>;
}
```

## Page Structure

### Typical Page Layout

```typescript
// app/example/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function ExamplePage() {
  // Authentication check
  const user = await requireAuth();
  const userId = user.id;
  
  // Data fetching
  const data = await db.getData(userId);
  
  // Render
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Page Title</h1>
      {/* Content */}
    </div>
  );
}
```

## Navigation

### Navigation Component

**Location**: `equity/components/Navigation.tsx`

**Features**:
- Responsive hamburger menu
- Accordion-style menu sections
- Active route highlighting
- User authentication state
- Admin link (if admin role)

**Menu Sections**:
1. **User Menu**: Settings, Logout
2. **Equity Menu**: Tradebook, Holdings, Ledger, Import
3. **Balance Sheet Menu**: Dashboard, Categories, Banks, Income, Expenses, Recurring
4. **Standalone**: Conflicts, Tools
5. **Admin**: Admin panel (if admin)

## Routing

### App Router Conventions

- `app/page.tsx` - Home page (`/`)
- `app/dashboard/page.tsx` - Dashboard (`/dashboard`)
- `app/api/route.ts` - API route (`/api/...`)
- `app/[id]/page.tsx` - Dynamic route (`/[id]`)

### Route Protection

**Middleware**: `equity/middleware.ts`

**Protected Routes**: All routes except:
- `/login`
- `/register`
- `/verify-email`
- Public API routes

**Admin Routes**: `/admin/*` (requires admin role)

## Performance Optimizations

### Server Components

- No client-side JavaScript for static content
- Data fetching on server (faster)
- Reduced bundle size

### Code Splitting

- Automatic code splitting by route
- Lazy loading for heavy components

### Image Optimization

- Next.js Image component (if used)
- Automatic optimization

## Accessibility

### Semantic HTML

- Proper heading hierarchy
- ARIA labels where needed
- Keyboard navigation support

### Responsive Design

- Mobile-first approach
- Tailwind responsive utilities
- Hamburger menu for mobile

## Build Process

### Development

```bash
cd equity
npm run dev
```

- Hot module replacement
- Fast refresh
- Development server on port 3000

### Production Build

```bash
cd equity
npm run build
npm start
```

- Optimized production bundle
- Server-side rendering
- Static generation where possible

