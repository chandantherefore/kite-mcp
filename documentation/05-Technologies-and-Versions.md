# Technologies and Versions

## Table of Contents

1. [Technology Stack Overview](#technology-stack-overview)
2. [MCP Server Dependencies](#mcp-server-dependencies)
3. [Portfolio Manager Dependencies](#portfolio-manager-dependencies)
4. [Runtime Requirements](#runtime-requirements)
5. [Build Tools and Configuration](#build-tools-and-configuration)
6. [Development Tools](#development-tools)
7. [Gap Identification](#gap-identification)

## Technology Stack Overview

The project uses a modern TypeScript/Node.js stack with the following main technologies:

- **Runtime**: Node.js
- **Language**: TypeScript
- **MCP Server**: Node.js with MCP SDK
- **Web Application**: Next.js 14 (React 18)
- **Database**: MySQL 8.0+
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS 4

## MCP Server Dependencies

**Location**: `package.json` (root)

### Production Dependencies

| Package | Version | Purpose |
|---------|--------|---------|
| `@modelcontextprotocol/sdk` | `^1.0.4` | MCP protocol SDK for server implementation |
| `kiteconnect` | `^5.1.0` | Zerodha Kite Connect JavaScript SDK |

### Development Dependencies

| Package | Version | Purpose |
|---------|--------|---------|
| `@types/node` | `^22.10.2` | TypeScript type definitions for Node.js |
| `typescript` | `^5.7.2` | TypeScript compiler |

### Package Scripts

```json
{
  "build": "tsc",
  "dev": "tsc --watch",
  "start": "node dist/index.js",
  "prepare": "npm run build"
}
```

### TypeScript Configuration

**Location**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## Portfolio Manager Dependencies

**Location**: `equity/package.json`

### Production Dependencies

| Package | Version | Purpose |
|---------|--------|---------|
| `@modelcontextprotocol/sdk` | `^1.23.0` | MCP SDK (for potential client usage) |
| `@types/bcryptjs` | `^3.0.0` | TypeScript types for bcryptjs |
| `bcryptjs` | `^3.0.3` | Password hashing library |
| `clsx` | `^2.1.1` | Utility for constructing className strings |
| `csv-parse` | `^6.1.0` | CSV parsing library |
| `kiteconnect` | `^5.1.0` | Zerodha Kite Connect SDK |
| `lucide-react` | `^0.555.0` | Icon library for React |
| `mysql2` | `^3.15.3` | MySQL client for Node.js |
| `next` | `^14.2.0` | Next.js framework |
| `next-auth` | `^4.24.13` | Authentication library for Next.js |
| `react` | `^18.3.1` | React library |
| `react-dom` | `^18.3.1` | React DOM renderer |
| `resend` | `^6.5.2` | Email service API client |
| `xirr` | `^1.1.0` | XIRR calculation library |
| `zustand` | `^5.0.8` | State management library |

### Development Dependencies

| Package | Version | Purpose |
|---------|--------|---------|
| `@tailwindcss/postcss` | `^4` | Tailwind CSS PostCSS plugin |
| `@types/node` | `^20` | TypeScript types for Node.js |
| `@types/react` | `^19` | TypeScript types for React |
| `@types/react-dom` | `^19` | TypeScript types for React DOM |
| `eslint` | `^9` | JavaScript/TypeScript linter |
| `eslint-config-next` | `16.0.5` | Next.js ESLint configuration |
| `tailwindcss` | `^4` | Tailwind CSS framework |
| `typescript` | `^5` | TypeScript compiler |

### Package Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

### TypeScript Configuration

**Location**: `equity/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@server/*": ["../dist/*"]
    }
  }
}
```

### Next.js Configuration

**Location**: `equity/next.config.mjs`

```javascript
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@server'] = path.resolve(__dirname, '../dist');
    return config;
  },
};
```

## Runtime Requirements

### Node.js

- **Minimum Version**: Node.js 18.0.0 or higher
- **Recommended Version**: Node.js 20.x LTS or higher
- **Package Manager**: npm (comes with Node.js)

### Database

- **Type**: MySQL
- **Minimum Version**: MySQL 8.0
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Engine**: InnoDB

### Operating System

- **Supported**: macOS, Linux, Windows
- **Development**: Tested on macOS (darwin 24.6.0)

<!-- TODO: [GAP] Add specific OS version requirements and compatibility matrix -->

## Build Tools and Configuration

### TypeScript

- **Version**: 5.7.2 (MCP Server), 5.x (Portfolio Manager)
- **Configuration**: Strict mode enabled
- **Module System**: ES Modules (Node16) for MCP Server, ESNext for Portfolio Manager

### Next.js

- **Version**: 14.2.0
- **App Router**: Enabled (using `app/` directory)
- **Server Components**: Default (can be async)
- **Client Components**: Marked with `'use client'` directive

### Tailwind CSS

- **Version**: 4.x
- **Configuration**: PostCSS plugin
- **Usage**: Utility-first CSS framework

### ESLint

- **Version**: 9.x
- **Configuration**: Next.js ESLint config
- **Purpose**: Code quality and consistency

## Development Tools

### Development Environment

- **DDEV**: Used for local development environment
  - **Location**: `.ddev/` directory
  - **Database**: MySQL via DDEV
  - **Configuration**: `.ddev/config.yaml`

### Version Control

- **Git**: Version control system
- **Repository**: Git repository with standard structure

### Code Editor

- **Recommended**: VS Code or Cursor
- **TypeScript**: Full TypeScript support required
- **Extensions**: ESLint, Prettier (recommended)

<!-- TODO: [GAP] Add recommended VS Code extensions and editor configuration -->

## Key Technology Decisions

### 1. Next.js App Router

**Decision**: Use Next.js 14 App Router instead of Pages Router.

**Rationale**:
- Modern React Server Components support
- Better performance with server-side rendering
- Improved developer experience
- Future-proof architecture

### 2. Zustand for State Management

**Decision**: Use Zustand instead of Redux or Context API.

**Rationale**:
- Lightweight and simple API
- No boilerplate code
- Good TypeScript support
- Sufficient for application needs

### 3. NextAuth.js for Authentication

**Decision**: Use NextAuth.js for authentication.

**Rationale**:
- Built-in support for multiple providers
- JWT session management
- Easy integration with Next.js
- Secure by default

### 4. MySQL2 for Database

**Decision**: Use mysql2 instead of other ORMs.

**Rationale**:
- Direct SQL control
- Connection pooling support
- Promise-based API
- Performance and flexibility

### 5. TypeScript Strict Mode

**Decision**: Enable TypeScript strict mode.

**Rationale**:
- Better type safety
- Catch errors at compile time
- Improved code quality
- Better IDE support

## Browser Compatibility

<!-- TODO: [GAP] Add browser compatibility requirements and testing matrix -->

The web application should work on:
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

**Note**: Modern browser features are used (ES2017+), so older browsers may not be supported.

## Performance Requirements

<!-- TODO: [GAP] Add specific performance requirements and benchmarks -->

### Expected Performance

- **Page Load**: < 2 seconds
- **API Response**: < 500ms (average)
- **Database Queries**: < 100ms (average)
- **XIRR Calculation**: < 1 second for typical portfolios

## Security Considerations

### Dependency Security

- **Regular Updates**: Dependencies should be kept up to date
- **Vulnerability Scanning**: Use `npm audit` regularly
- **Dependency Pinning**: Use exact versions in production (consider)

### TypeScript Strict Mode

- **Type Safety**: Prevents many runtime errors
- **Null Safety**: Strict null checks enabled
- **No Implicit Any**: All types must be explicit

## Gap Identification

The following areas require additional technology documentation:

1. **Browser Compatibility**: Detailed browser compatibility matrix and testing
2. **Performance Benchmarks**: Specific performance targets and benchmarks
3. **Security Requirements**: Detailed security requirements and compliance
4. **Deployment Requirements**: Production deployment technology stack
5. **Monitoring Tools**: Application monitoring and logging tools
6. **CI/CD Tools**: Continuous integration and deployment tools
7. **Testing Frameworks**: Testing frameworks and tools used
8. **Documentation Tools**: Tools for generating API documentation
9. **Code Quality Tools**: Additional code quality and formatting tools
10. **Development Environment Setup**: Detailed development environment setup guide

See also: [06-Environment-Variables.md](06-Environment-Variables.md) for environment configuration.

