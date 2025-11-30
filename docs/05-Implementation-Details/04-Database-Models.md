# Database Models

## Table: `accounts`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Auto-increment ID |
| `name` | VARCHAR | Display name |
| `broker_id` | VARCHAR | Kite Client ID |
| `last_sync` | DATETIME | Timestamp of last successful sync |

## Table: `trades`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Internal ID |
| `account_id` | INT FK | Reference to `accounts` |
| `symbol` | VARCHAR | e.g., "INFY" |
| `trade_type` | ENUM | 'buy' or 'sell' |
| `quantity` | INT | Number of shares |
| `price` | DECIMAL | Execution price |
| `order_id` | VARCHAR | Unique Kite Order ID |
| `trade_date` | DATETIME | Time of trade |

## Table: `ledger`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Internal ID |
| `amount` | DECIMAL | Credit (+ve) or Debit (-ve) |
| `posting_date`| DATETIME | Date of transaction |
| `description` | VARCHAR | Transaction details |

## Table: `import_conflicts`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Internal ID |
| `new_data` | JSON | The record trying to be inserted |
| `existing_data`| JSON | The record currently in DB |
| `status` | VARCHAR | 'pending', 'resolved' |

