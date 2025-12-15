# Data Import

## Feature Description

CSV import functionality for tradebook and ledger data with conflict detection and resolution.

## User Stories

- **As a User**, I want to import my tradebook CSV so that I can track all my trades.
- **As a User**, I want to import my ledger CSV so that I can calculate XIRR.
- **As a User**, I want to see import conflicts so that I can resolve data mismatches.
- **As a User**, I want to resolve conflicts so that my data is accurate.

## Technical Implementation

### Tradebook Import

**API Route**: `POST /api/import/tradebook`

**CSV Format**: Expected columns from Zerodha tradebook export

**Process**:
1. Parse CSV file (using `csv-parse`)
2. Validate each record (required fields, data types)
3. Check for duplicates (by trade_id per account)
4. Create conflicts for mismatches
5. Insert new trades
6. Update account sync timestamp and record count

**Conflict Detection**:
- Duplicate `trade_id` with different data
- Missing required fields
- Invalid data formats

### Ledger Import

**API Route**: `POST /api/import/ledger`

**CSV Format**: Expected columns from Zerodha ledger export

**Process**:
1. Parse CSV file
2. Validate each record
3. Check for duplicates (by posting_date + particular)
4. Create conflicts for mismatches
5. Insert new ledger entries
6. Update account sync timestamp and record count

### Conflict Management

**API Routes**: 
- `GET /api/conflicts?accountId=...&status=...` - List conflicts
- `PUT /api/conflicts/[id]` - Resolve conflict

**Conflict Types**:
- `duplicate_trade_id` - Same trade_id with different data
- `duplicate_ledger` - Duplicate ledger entry
- `data_mismatch` - Field values differ

**Resolution Options**:
- `resolved_keep_existing` - Keep database record
- `resolved_use_new` - Replace with CSV data
- `resolved_manual` - Manually resolved
- `ignored` - Ignore conflict

**Conflict Storage**:
- `import_conflicts` table
- JSON storage for existing_data and new_data
- Tracks conflict field, status, resolution

### Import Tracking

**Account Sync Fields**:
- `last_tradebook_sync` - Last tradebook import timestamp
- `last_ledger_sync` - Last ledger import timestamp
- `tradebook_records_count` - Total tradebook records
- `ledger_records_count` - Total ledger records

**Import Batch Tracking**:
- `import_batch_id` - UUID for each import
- `import_date` - Import timestamp
- Enables rollback of specific imports

## Database Tables

- `trades` - Trade records
- `ledger` - Ledger entries
- `import_conflicts` - Conflict tracking
- `accounts` - Sync timestamps

## Files

- `equity/app/api/import/tradebook/route.ts` - Tradebook import
- `equity/app/api/import/ledger/route.ts` - Ledger import
- `equity/app/api/conflicts/route.ts` - Conflict management
- `equity/app/import/page.tsx` - Import UI
- `equity/app/conflicts/page.tsx` - Conflict resolution UI

