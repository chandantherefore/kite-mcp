---
name: "Plan: Migrate to DDEV and Implement Accounts Overview with Import Feature"
overview: ""
todos:
  - id: afd9f64a-2953-4140-9ec1-8fba05a50292
    content: Create/Update requirements document in docs/FR-001-accounts-overview.md
    status: pending
  - id: 07718152-407f-458e-aeb8-3c2d31f719df
    content: Create/Update requirements document in docs/FR-001-accounts-overview.md
    status: pending
  - id: e8069838-7a07-4d94-a9df-360c78f5530e
    content: Initialize and configure DDEV (mysql, nodejs) for 'oneapp'
    status: pending
  - id: c62b5522-7534-476e-8214-70275e8779d9
    content: Install dependencies (mysql2, csv-parse, xirr) in kite-client-app
    status: pending
  - id: 2529eadf-8a58-4fb7-a4c1-871a04b575e7
    content: Create DB connection and schema initialization scripts
    status: pending
  - id: b0f4e29d-a317-47ee-afd7-4e6f1e0712ae
    content: Implement Account Management API (CRUD)
    status: pending
  - id: 9313eb58-774c-4681-b635-9a9bd294121e
    content: Implement API routes for Tradebook and Ledger import
    status: pending
  - id: 3ed585bd-9908-42ee-a4d9-c6b882391617
    content: Implement API routes for Data fetching and XIRR calculation
    status: pending
  - id: 27237882-ee5e-4100-a7e8-f6fd1fffd43d
    content: Create Account Management Page (Settings)
    status: pending
  - id: 93a0e6fe-164f-4c98-b8e1-631b6622c40f
    content: Create Frontend Import Page with Account Selection
    status: pending
  - id: 8784332b-a097-498e-962f-b92cfc507e84
    content: Update Dashboard to show Consolidated/Individual Stats
    status: pending
  - id: d7b77722-6f46-4762-845f-3714a9700e6a
    content: Update DB Schema for Last Sync and Conflicts
    status: pending
  - id: e2ff1787-d097-4c9d-ace7-e640ed291876
    content: Update Import APIs to track Sync Date & Detect Conflicts
    status: pending
  - id: e94ad236-598e-422f-8950-270dfd8c3615
    content: Implement Conflicts API & Frontend Page
    status: pending
  - id: f9cbaf0f-4a0c-4207-a6c6-bdb9effc0063
    content: Implement Stock Split Tool (API & Frontend)
    status: pending
---

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