# Changelog

All notable changes to the Kite MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-28

### Added
- Initial release of Kite MCP Server
- Authentication flow with login and session generation
- Complete order management (place, modify, cancel)
- Portfolio management (positions, holdings, MF holdings)
- Market data access (quotes, OHLC, LTP, historical data)
- GTT (Good Till Triggered) order support
- Instrument search functionality
- Account and margin information retrieval
- Pagination support for all list endpoints
- Persistent credential storage in `~/.kite-mcp-credentials.json`
- Comprehensive documentation:
  - README with full feature list
  - QUICKSTART guide for fast setup
  - USAGE_EXAMPLES with real-world scenarios
  - API_REFERENCE with complete parameter documentation
- Test script for installation verification
- Claude Desktop configuration example
- MIT License

### Features
- ✅ 24 MCP tools covering all major Kite Connect APIs
- ✅ Support for all order types (Market, Limit, SL, SL-M)
- ✅ Support for all order varieties (Regular, AMO, CO, Iceberg, Auction)
- ✅ All product types (CNC, MIS, NRML, MTF)
- ✅ All major exchanges (NSE, BSE, NFO, BFO, MCX)
- ✅ Single and two-leg GTT orders
- ✅ Historical data with multiple intervals
- ✅ Batch quote retrieval (up to 500 instruments)
- ✅ TypeScript with full type safety
- ✅ Error handling and authentication management

### Dependencies
- `@modelcontextprotocol/sdk`: ^1.0.4
- `kiteconnect`: ^5.1.0
- TypeScript: ^5.7.2
- Node.js: v18+

### Security
- Credentials stored locally in user home directory
- API secrets never logged or exposed
- Follows Kite Connect security best practices

## [Unreleased]

### Planned
- WebSocket support for real-time market data
- Order update notifications via WebSocket
- Bulk order placement
- Portfolio analytics and reporting
- Paper trading mode
- Configuration file for custom settings
- CLI for standalone usage
- Docker support
- Advanced error recovery
- Retry mechanisms for API failures
- Rate limiting implementation
- Logging configuration options

---

## Version History

### Version Format
- **Major**: Breaking changes or significant feature additions
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes and minor improvements

### Support
For issues and feature requests, please visit the GitHub repository.

---

**[1.0.0]**: Initial Release - 2025-11-28

