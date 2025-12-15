# Data Models

TypeScript interfaces and data models used throughout the application.

## Location

**Equity Models**: `equity/lib/db.ts`  
**Balance Sheet Models**: `equity/lib/balancesheet-db.ts`

## Equity Module Models

### User

```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  password: string | null;  // NULL for OAuth users
  first_name: string;
  last_name: string;
  dob: Date;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  expertise_level: '0-1' | '1-5' | '5-10' | '10+';
  role: 'user' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: Date | null;
  google_id: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### Account

```typescript
export interface Account {
  id: number;
  user_id: number;
  name: string;
  broker_id: string | null;
  api_key: string | null;
  api_secret: string | null;
  access_token: string | null;
  access_token_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  last_tradebook_sync: Date | null;
  last_ledger_sync: Date | null;
  tradebook_records_count: number;
  ledger_records_count: number;
}
```

### Trade

```typescript
export interface Trade {
  id: number;
  account_id: number;
  symbol: string;
  isin: string | null;
  trade_date: Date;
  exchange: string | null;
  segment: string | null;
  series: string | null;
  trade_type: 'buy' | 'sell';
  auction: boolean;
  quantity: number;
  price: number;
  trade_id: string | null;
  order_id: string | null;
  order_execution_time: Date | null;
  created_at: Date;
  import_batch_id: string | null;
  import_date: Date | null;
}
```

### Ledger

```typescript
export interface Ledger {
  id: number;
  account_id: number;
  particular: string | null;
  posting_date: Date;
  cost_center: string | null;
  voucher_type: string | null;
  debit: number;
  credit: number;
  net_balance: number | null;
  created_at: Date;
  import_batch_id: string | null;
  import_date: Date | null;
}
```

### ImportConflict

```typescript
export interface ImportConflict {
  id: number;
  account_id: number;
  import_type: 'tradebook' | 'ledger';
  conflict_type: string;
  existing_data: any;  // JSON object
  new_data: any;  // JSON object
  conflict_field: string | null;
  status: 'pending' | 'resolved_keep_existing' | 'resolved_use_new' | 'resolved_manual' | 'ignored';
  resolved_at: Date | null;
  resolved_by: string | null;
  created_at: Date;
}
```

## Balance Sheet Module Models

### BSCategory

```typescript
export interface BSCategory {
  id: number;
  user_id: number;
  name: string;
  type: 'income' | 'expense';
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### BSBank

```typescript
export interface BSBank {
  id: number;
  user_id: number;
  name: string;
  ifsc_code: string | null;
  account_name: string | null;
  account_number: string | null;
  balance: number;
  created_at: Date;
  updated_at: Date;
}
```

### BSTransaction

```typescript
export interface BSTransaction {
  id: number;
  user_id: number;
  category_id: number;
  bank_id: number;
  type: 'income' | 'expense';
  amount: number;
  transaction_date: Date;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### BSRecurring

```typescript
export interface BSRecurring {
  id: number;
  user_id: number;
  category_id: number;
  bank_id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
```

## Usage Examples

### Creating a User

```typescript
import { db } from '@/lib/db';

const userId = await db.insert(
  'INSERT INTO users (username, email, password, first_name, last_name, dob, gender, expertise_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ['user123', 'user@example.com', hashedPassword, 'John', 'Doe', '1990-01-01', 'male', '1-5']
);
```

### Fetching User's Accounts

```typescript
import { db } from '@/lib/db';

const accounts = await db.getAccounts(userId);
// Returns Account[]
```

### Creating a Trade

```typescript
import { db } from '@/lib/db';

const tradeId = await db.insert(
  'INSERT INTO trades (account_id, symbol, trade_date, trade_type, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
  [accountId, 'RELIANCE', '2024-01-01', 'buy', 10, 2500]
);
```

### Fetching Balance Sheet Categories

```typescript
import { bsDb } from '@/lib/balancesheet-db';

const incomeCategories = await bsDb.getCategories(userId, 'income');
// Returns BSCategory[]
```

## Type Safety

All database operations use these TypeScript interfaces for:
- Type checking at compile time
- IntelliSense/autocomplete in IDEs
- Documentation of data structures
- Runtime validation (where implemented)

## Model Validation

**Current Status**: Type checking only (compile-time)

**Future Considerations**:
- Runtime validation (Zod, Yup, etc.)
- Input sanitization
- Business rule validation

