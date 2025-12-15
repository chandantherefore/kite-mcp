# Technology Stack

## Overview

Complete list of technologies, libraries, and tools used in the OneApp Portfolio project.

## Runtime Environment

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | v20.x+ | JavaScript runtime |
| npm | v10.x+ | Package manager |
| MySQL | v8.0+ | Database |

## Programming Languages

| Language | Version | Usage |
|----------|---------|-------|
| TypeScript | 5.7.2 (root), 5.x (equity) | Primary language |
| JavaScript | ES2022 (root), ES2017+ (equity) | Runtime target |

## Frontend Technologies

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 14.2.0 | React framework with App Router |
| React | 18.3.1 | UI library |
| React DOM | 18.3.1 | React renderer |

### Styling

| Package | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | 4 | Utility-first CSS framework |
| @tailwindcss/postcss | 4 | PostCSS plugin for Tailwind |

### Icons

| Package | Version | Purpose |
|---------|---------|---------|
| lucide-react | 0.555.0 | Icon library |

### State Management

| Package | Version | Purpose |
|---------|---------|---------|
| zustand | 5.0.8 | Lightweight state management |

### Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| clsx | 2.1.1 | Conditional className utility |

## Backend Technologies

### Web Framework

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 14.2.0 | API routes and server components |

### Authentication

| Package | Version | Purpose |
|---------|---------|---------|
| next-auth | 4.24.13 | Authentication library |
| bcryptjs | 3.0.3 | Password hashing |

### Database

| Package | Version | Purpose |
|---------|---------|---------|
| mysql2 | 3.15.3 | MySQL client for Node.js |

### External APIs

| Package | Version | Purpose |
|---------|---------|---------|
| kiteconnect | 5.1.0 | Zerodha Kite Connect SDK |
| resend | 6.5.2 | Email service API client |

### Data Processing

| Package | Version | Purpose |
|---------|---------|---------|
| csv-parse | 6.1.0 | CSV parsing library |
| xirr | 1.1.0 | XIRR calculation library |

## MCP Server Technologies

| Package | Version | Purpose |
|---------|---------|---------|
| @modelcontextprotocol/sdk | 1.0.4 | MCP protocol SDK |
| kiteconnect | 5.1.0 | Zerodha Kite Connect SDK |

## Development Tools

### TypeScript

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.7.2 (root), 5.x (equity) | TypeScript compiler |
| @types/node | 22.10.2 (root), 20.x (equity) | Node.js type definitions |
| @types/react | 19 | React type definitions |
| @types/react-dom | 19 | React DOM type definitions |
| @types/bcryptjs | 3.0.0 | bcryptjs type definitions |

### Linting

| Package | Version | Purpose |
|---------|---------|---------|
| eslint | 9 | JavaScript/TypeScript linter |
| eslint-config-next | 16.0.5 | Next.js ESLint configuration |

## Build Tools

### TypeScript Configuration

**Root** (`tsconfig.json`):
- Target: ES2022
- Module: Node16
- Strict mode enabled
- Source maps enabled

**Equity** (`equity/tsconfig.json`):
- Target: ES2017
- Module: ESNext
- JSX: preserve
- Path aliases: `@/*`, `@server/*`

### Next.js Configuration

**File**: `equity/next.config.mjs`

**Features**:
- Webpack alias for `@server` (MCP server)
- Path resolution for root MCP server

### PostCSS Configuration

**File**: `equity/postcss.config.mjs`

**Plugins**:
- Tailwind CSS

## Browser Support

**Target**: Modern browsers (ES2017+)

**Tested**:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Package Management

### Root Package

**File**: `package.json`

**Type**: Module (ESM)

**Scripts**:
- `build` - Compile TypeScript
- `dev` - Watch mode compilation
- `start` - Run compiled server
- `prepare` - Pre-publish build

### Equity Package

**File**: `equity/package.json`

**Type**: CommonJS (default)

**Scripts**:
- `dev` - Development server
- `build` - Production build
- `start` - Production server
- `lint` - Run ESLint

## Version Constraints

### Caret (^) Ranges

Most dependencies use caret ranges (e.g., `^14.2.0`), allowing:
- Minor version updates
- Patch version updates
- Excluding major version updates

### Exact Versions

Some critical dependencies may use exact versions for stability.

## Security Considerations

### Dependency Security

- Regular `npm audit` checks recommended
- Keep dependencies updated
- Monitor security advisories

### Type Safety

- TypeScript strict mode enabled
- No implicit any
- Strict null checks

## Performance

### Bundle Size

- Server Components reduce client bundle
- Code splitting by route
- Tree shaking enabled

### Runtime Performance

- Connection pooling (10 connections)
- Indexed database queries
- Async/await for I/O operations

## Future Considerations

### Potential Additions

- Testing framework (Jest, Playwright)
- Storybook for component development
- Docker for containerization
- CI/CD tools (GitHub Actions, etc.)
- Monitoring tools (Sentry, etc.)

