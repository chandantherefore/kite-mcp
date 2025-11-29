<!-- ec2946de-5e22-424f-8c19-a01c8d37fca2 242a303d-52e5-4916-8dff-2e76e8221f56 -->
# Plan: Migrate to DDEV and Implement Accounts Overview with Import Feature

## 1. Documentation & Project Setup

- [ ] Create requirements document `docs/FR-001-accounts-overview.md` (update existing).
- [ ] Initialize DDEV project `oneapp` in the root directory.
- [ ] Configure DDEV to use MySQL (MariaDB) and Node.js.
- [ ] Configure DDEV web container to serve the Next.js application (`kite-client-app`).

## 2. Database Implementation

- [ ] Update database schema:
- Add `last_sync_tradebook` and `last_sync_ledger` timestamps to `accounts` table.
- Create `import_conflicts` table (id, account_id, type, data, status, created_at).
- [ ] Create migration script for new schema changes.
- [ ] Update `db.ts` types and interfaces.

## 3. Backend API Implementation (Next.js)

- [ ] Update Import APIs (`tradebook` & `ledger`) to:
- Update `last_sync` timestamps on success.
- Detect duplicates and insert into `import_conflicts` instead of auto-merging.
- [ ] Create API Routes for Conflicts:
- `GET /api/conflicts` - List pending conflicts.
- `POST /api/conflicts/resolve` - Resolve conflict (keep existing, overwrite, or edit).
- [ ] Create API Route for Stock Splits:
- `POST /api/tools/split` - Apply split logic (update quantity/price for trades < date).
- [ ] Install dependencies: `mysql2`, `csv-parse`, `xirr` (for calculation).
- [ ] Create API Route: `POST /api/accounts` - Create new account.
- [ ] Create API Route: `GET /api/accounts` - List all accounts.
- [ ] Create API Route: `PUT/DELETE /api/accounts/[id]` - Manage accounts.
- [ ] Create API Route: `POST /api/import/tradebook` - Parse and save Tradebook CSV (requires `accountId`).
- [ ] Create API Route: `POST /api/import/ledger` - Parse and save Ledger CSV (requires `accountId`).
- [ ] Create API Route: `GET /api/stats` - Fetch consolidated/individual XIRR and portfolio status.

## 4. Frontend Implementation

- [ ] Update `ImportPage`:
- Display "Last Synced" date for each account.
- Show notification if conflicts are detected after import.
- [ ] Create `ConflictsPage`:
- List conflicts with side-by-side comparison (Existing vs New).
- Actions: Accept New, Keep Existing, Edit Manually.
- [ ] Create `StockSplitTool` component (modal or page):
- Inputs: Symbol, Split Date, Ratio (e.g., 1:5).
- Preview impact (e.g., "10 trades will be updated").
- Confirm & Apply.
- [ ] Update `Navigation` to include new tools/pages.
- [ ] Create `SettingsPage` (or `AccountsPage`):
- List existing accounts.
- Form to add new accounts (Name, Broker ID, etc.).
- [ ] Create `ImportPage` component:
- Account selection dropdown (populated from API).
- File uploaders for Tradebook and Ledger.
- [ ] Create global `AccountSwitcher` component (Consolidated / Individual Accounts).
- [ ] Update `Dashboard` to display:
- Current Valuation (calculated from latest prices vs imported cost).
- XIRR (Consolidated & Individual).
- Stock-wise XIRR table.
- [ ] Integrate visualization charts (optional, if time permits).

## 5. Verification

- [ ] Verify DDEV setup starts correctly.
- [ ] Test CSV import with sample data.
- [ ] Verify data persistence in MySQL.
- [ ] Check XIRR calculations against expected values.

### To-dos

- [ ] Create/Update requirements document in docs/FR-001-accounts-overview.md
- [ ] Create/Update requirements document in docs/FR-001-accounts-overview.md
- [ ] Initialize and configure DDEV (mysql, nodejs) for 'oneapp'
- [ ] Install dependencies (mysql2, csv-parse, xirr) in kite-client-app
- [ ] Create DB connection and schema initialization scripts
- [ ] Implement Account Management API (CRUD)
- [ ] Implement API routes for Tradebook and Ledger import
- [ ] Implement API routes for Data fetching and XIRR calculation
- [ ] Create Account Management Page (Settings)
- [ ] Create Frontend Import Page with Account Selection
- [ ] Update Dashboard to show Consolidated/Individual Stats
- [ ] Update DB Schema for Last Sync and Conflicts
- [ ] Update Import APIs to track Sync Date & Detect Conflicts
- [ ] Implement Conflicts API & Frontend Page
- [ ] Implement Stock Split Tool (API & Frontend)