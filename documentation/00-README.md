# Kite MCP Server + OneApp Portfolio Manager - Documentation Index

## Overview

This documentation provides comprehensive information about the Kite MCP Server and OneApp Portfolio Manager project. The documentation is organized into multiple sections covering all aspects of the system.

## Documentation Structure

1. **[01-Project-Overview.md](01-Project-Overview.md)** - High-level project description, purpose, features, and use cases
2. **[02-Architecture.md](02-Architecture.md)** - System architecture, design patterns, and architectural decisions
3. **[03-Data-Modeling.md](03-Data-Modeling.md)** - Database schema, entity relationships, data models, and database design decisions
4. **[04-Components-and-Relationships.md](04-Components-and-Relationships.md)** - Detailed component breakdown with relationships and data flow
5. **[05-Technologies-and-Versions.md](05-Technologies-and-Versions.md)** - Complete technology stack with exact versions from package.json files
6. **[06-Environment-Variables.md](06-Environment-Variables.md)** - All environment variables with descriptions, defaults, and examples
7. **[07-Implementation-Details.md](07-Implementation-Details.md)** - Feature-by-feature and page-by-page implementation details
8. **[08-Special-Considerations.md](08-Special-Considerations.md)** - Important notes, warnings, best practices, and things to consider

## Quick Start

For developers new to the project:

1. Start with [01-Project-Overview.md](01-Project-Overview.md) to understand what the project does
2. Review [02-Architecture.md](02-Architecture.md) to understand the system design
3. Check [05-Technologies-and-Versions.md](05-Technologies-and-Versions.md) for setup requirements
4. Configure [06-Environment-Variables.md](06-Environment-Variables.md) for your environment
5. Read [07-Implementation-Details.md](07-Implementation-Details.md) for feature-specific information
6. Review [08-Special-Considerations.md](08-Special-Considerations.md) before deploying

## Project Components

### Kite MCP Server
A Model Context Protocol (MCP) server that provides access to Zerodha Kite Connect trading APIs. This allows AI assistants and other MCP clients to interact with Kite trading functionality.

**Location**: `src/` directory

### OneApp Portfolio Manager
A Next.js web application for managing multiple Zerodha trading accounts, importing historical trade data, calculating XIRR returns, and providing portfolio analytics.

**Location**: `equity/` directory

## Gap Identification

Throughout this documentation, gaps and areas requiring developer input are marked with:
```
<!-- TODO: [GAP] Description of what needs to be filled -->
```

A summary of all identified gaps can be found at the end of each document.

## Contributing

When updating this documentation:
- Maintain consistent formatting
- Update cross-references when moving sections
- Add gap markers for incomplete information
- Include code examples where relevant
- Update version numbers when dependencies change

## Related Resources

- [Main README](../README.md) - Project setup and quick start
- [Existing Documentation](../docs/) - Additional project documentation (preserved separately)

