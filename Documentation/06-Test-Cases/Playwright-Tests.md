# Playwright Tests

## Current Status

**Status**: Not configured

**Existing Test Scripts**:
- `equity/test-kite-auth.js` - Ad-hoc Kite authentication test
- `equity/test-yahoo-prices.js` - Ad-hoc Yahoo Finance price test

## Recommended Test Structure

### Setup

**Install Playwright**:
```bash
cd equity
npm install -D @playwright/test
npx playwright install
```

**Configuration**: Create `playwright.config.ts`

### Test Categories

1. **Authentication Tests**
   - User registration
   - Email verification
   - Login (credentials)
   - Login (Google OAuth)
   - Logout

2. **Account Management Tests**
   - Create account
   - Update account
   - Delete account
   - List accounts

3. **Trade Management Tests**
   - Create trade
   - Update trade
   - Delete trade
   - List trades

4. **Import Tests**
   - Tradebook import
   - Ledger import
   - Conflict detection
   - Conflict resolution

5. **Balance Sheet Tests**
   - Bank CRUD
   - Category CRUD
   - Transaction CRUD
   - Recurring transactions

6. **API Tests**
   - All API endpoints
   - Authentication required
   - Authorization checks
   - Error handling

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  // Registration
  await page.goto('/register');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  // ... fill other fields
  await page.click('button[type="submit"]');
  
  // Verify email (if configured)
  // ...
  
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

## Test Results

**Location**: `Documentation/6-Test-Cases/Test-Results/`

**Format**: Test result files (HTML reports, JSON summaries, etc.)

## Future Implementation

When implementing tests:
1. Set up Playwright configuration
2. Create test files in `equity/tests/` or `equity/__tests__/`
3. Add test scripts to `package.json`
4. Document test coverage
5. Add CI/CD integration

