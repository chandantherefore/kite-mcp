# Dependencies

Complete list of all npm packages with versions and purposes.

## Root Package (MCP Server)

**Location**: `package.json`

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | `^1.0.4` | MCP protocol SDK |
| `kiteconnect` | `^5.1.0` | Zerodha Kite Connect SDK |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/node` | `^22.10.2` | Node.js type definitions |
| `typescript` | `^5.7.2` | TypeScript compiler |

## Equity Package (Next.js Application)

**Location**: `equity/package.json`

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | `^1.23.0` | MCP SDK (for potential client usage) |
| `@types/bcryptjs` | `^3.0.0` | bcryptjs type definitions |
| `bcryptjs` | `^3.0.3` | Password hashing |
| `clsx` | `^2.1.1` | Conditional className utility |
| `csv-parse` | `^6.1.0` | CSV parsing |
| `kiteconnect` | `^5.1.0` | Zerodha Kite Connect SDK |
| `lucide-react` | `^0.555.0` | Icon library |
| `mysql2` | `^3.15.3` | MySQL client |
| `next` | `^14.2.0` | Next.js framework |
| `next-auth` | `^4.24.13` | Authentication library |
| `react` | `^18.3.1` | React library |
| `react-dom` | `^18.3.1` | React DOM renderer |
| `resend` | `^6.5.2` | Email service API |
| `xirr` | `^1.1.0` | XIRR calculation library |
| `zustand` | `^5.0.8` | State management |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/postcss` | `^4` | Tailwind PostCSS plugin |
| `@types/node` | `^20` | Node.js type definitions |
| `@types/react` | `^19` | React type definitions |
| `@types/react-dom` | `^19` | React DOM type definitions |
| `eslint` | `^9` | JavaScript/TypeScript linter |
| `eslint-config-next` | `16.0.5` | Next.js ESLint config |
| `tailwindcss` | `^4` | Tailwind CSS framework |
| `typescript` | `^5` | TypeScript compiler |

## Dependency Categories

### Core Framework
- `next` - Next.js framework
- `react`, `react-dom` - React library

### Database
- `mysql2` - MySQL client with connection pooling

### Authentication
- `next-auth` - Authentication library
- `bcryptjs` - Password hashing

### External APIs
- `kiteconnect` - Zerodha Kite Connect
- `resend` - Email service

### Data Processing
- `csv-parse` - CSV parsing
- `xirr` - XIRR calculations

### UI
- `tailwindcss` - CSS framework
- `lucide-react` - Icons
- `clsx` - ClassName utility

### State Management
- `zustand` - Lightweight state management

### Development
- `typescript` - TypeScript compiler
- `eslint` - Linter
- `@types/*` - Type definitions

## Version Constraints

Most dependencies use caret (`^`) ranges, allowing:
- Minor version updates
- Patch version updates
- Excluding major version updates

## Security

Regular `npm audit` checks recommended to identify vulnerabilities.

