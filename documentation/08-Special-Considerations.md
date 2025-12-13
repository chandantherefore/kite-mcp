# Special Considerations

## Table of Contents

1. [Security Considerations](#security-considerations)
2. [Performance Considerations](#performance-considerations)
3. [Rate Limiting](#rate-limiting)
4. [Session Management](#session-management)
5. [Data Privacy](#data-privacy)
6. [Multi-Account Handling](#multi-account-handling)
7. [CSV Import Limitations](#csv-import-limitations)
8. [Known Limitations](#known-limitations)
9. [Best Practices](#best-practices)
10. [Gap Identification](#gap-identification)

## Security Considerations

### Credential Storage

**MCP Server**:
- Credentials stored in `~/.kite-mcp-credentials.json`
- **Action Required**: Ensure file permissions are restricted:
  ```bash
  chmod 600 ~/.kite-mcp-credentials.json
  ```
- Contains sensitive data: API keys, secrets, and access tokens
- Never commit this file to version control

**Web Application**:
- Passwords hashed with bcrypt (cost factor 10)
- OAuth tokens managed by NextAuth.js
- Session tokens stored as JWTs
- Database credentials in environment variables

### API Security

- **Kite Connect API**: Uses OAuth 2.0 for authentication
- **Access Tokens**: Expire at end of trading day
- **API Keys**: Should be kept secure and rotated periodically
- **Rate Limiting**: Kite API has rate limits (see Rate Limiting section)

### Database Security

- **Connection Pooling**: Uses connection pool to prevent connection exhaustion
- **Prepared Statements**: All queries use prepared statements to prevent SQL injection
- **Password Storage**: Passwords are hashed, never stored in plain text
- **Environment Variables**: Database credentials should be in environment variables, not code

### Authentication Security

- **Email Verification**: Required before account activation
- **Session Management**: JWT-based sessions with expiration
- **Role-Based Access**: Admin routes protected by middleware
- **OAuth Security**: Google OAuth uses secure redirect URIs
- **Route Protection**: All routes except public ones (login, register, verify-email) require authentication
- **Error Responses**: Proper HTTP status codes:
  - **401 Unauthorized**: User is not authenticated
  - **403 Forbidden**: User is authenticated but lacks permission
  - **404 Not Found**: Resource doesn't exist or user doesn't have access
- **Server-Side Validation**: All pages and API routes validate authentication server-side
- **User Isolation**: Users can only access their own resources (accounts, trades, ledger entries)

### Input Validation

- **CSV Import**: Validates all imported data
- **API Endpoints**: Validate all input parameters
- **Type Checking**: TypeScript provides compile-time type safety
- **SQL Injection**: Prevented through prepared statements

<!-- TODO: [GAP] Add comprehensive security audit checklist and penetration testing requirements -->

## Performance Considerations

### Database Performance

- **Indexes**: Key columns are indexed for fast queries
- **Connection Pooling**: Reuses database connections
- **Query Optimization**: Uses efficient queries with proper WHERE clauses
- **Pagination**: Large result sets are paginated

### API Performance

- **Async Operations**: All I/O operations are asynchronous
- **Error Handling**: Errors are caught and handled gracefully
- **Response Caching**: Consider implementing caching for frequently accessed data

### Frontend Performance

- **Server Components**: Uses Next.js Server Components for better performance
- **Client Components**: Only used when necessary (interactivity, state)
- **State Management**: Zustand provides efficient state updates
- **Code Splitting**: Next.js automatically code-splits pages

### XIRR Calculation

- **Performance**: XIRR calculations can be slow for large datasets
- **Optimization**: Consider caching XIRR results
- **Batch Processing**: Large portfolios may need batch processing

<!-- TODO: [GAP] Add performance benchmarks and optimization targets -->

## Rate Limiting

### Kite Connect API Rate Limits

**Important**: Zerodha Kite Connect API has rate limits:

- **General Rate Limit**: 3 requests per second
- **Specific Endpoints**: Some endpoints have specific limits
- **Websocket**: For real-time data, use WebSocket connections (not implemented)

**Implementation**:
- Current implementation does not include rate limiting
- **Action Required**: Implement rate limiting to prevent API errors
- Consider using a rate limiting library or queue system

### Application Rate Limiting

<!-- TODO: [GAP] Add application-level rate limiting implementation -->

**Recommendations**:
- Implement rate limiting for API endpoints
- Use middleware for rate limiting
- Consider per-user rate limits
- Log rate limit violations

## Session Management

### MCP Server Sessions

- **Storage**: In-memory Map with account IDs as keys
- **Persistence**: Credentials saved to `~/.kite-mcp-credentials.json`
- **Lifecycle**: Sessions persist until server restart or token expiration
- **Token Expiration**: Kite access tokens expire at end of trading day

### Web Application Sessions

- **Provider**: NextAuth.js
- **Strategy**: JWT-based sessions
- **Storage**: JWT tokens stored in HTTP-only cookies
- **Expiration**: Configurable session expiration
- **Refresh**: Automatic token refresh (if configured)

### Session Security

- **HTTP-Only Cookies**: Prevents XSS attacks
- **Secure Cookies**: Should use Secure flag in production (HTTPS)
- **SameSite**: Should use SameSite=Strict or Lax

## Data Privacy

### User Data

- **Personal Information**: Stored securely in database
- **Password Security**: Passwords are hashed and never exposed
- **Email Privacy**: Email addresses used only for authentication and verification
- **Data Visibility Toggle**: Users can toggle data visibility in UI

### Trading Data

- **Account Isolation**: Data is isolated by account
- **Access Control**: Users can only access their own accounts
- **Admin Access**: Admins have access to all user data (for management)

### Data Retention

<!-- TODO: [GAP] Add data retention policies and deletion procedures -->

**Considerations**:
- How long to retain trade data?
- When to archive old data?
- User data deletion requests (GDPR compliance)

## Multi-Account Handling

### MCP Server

- **Session Management**: Separate sessions for each account
- **Account Identification**: Uses client_id parameter
- **Configuration**: Accounts loaded from environment variables
- **Credential Storage**: All accounts stored in single credentials file

### Web Application

- **Account Selection**: Users can select which account to view
- **Consolidated View**: Option to view all accounts together
- **Data Isolation**: Data is properly isolated by account_id

### Challenges

- **Session Management**: Managing multiple authenticated sessions
- **Data Aggregation**: Consolidating data from multiple accounts
- **Performance**: Fetching data for multiple accounts can be slow

## CSV Import Limitations

### File Size

- **Memory Usage**: Large CSV files are loaded into memory
- **Processing Time**: Large files take time to process
- **Recommendation**: Consider streaming for very large files

### Data Validation

- **Required Fields**: All required fields must be present
- **Data Types**: Values must match expected data types
- **Date Formats**: Dates must be in correct format
- **Numeric Values**: Numbers must be valid

### Conflict Resolution

- **Duplicate Detection**: Based on trade_id for trades
- **Manual Resolution**: Conflicts require manual resolution
- **Data Loss Risk**: Incorrect conflict resolution can cause data loss

### CSV Format Requirements

- **Headers**: Must match expected column names
- **Encoding**: Should be UTF-8
- **Delimiters**: Comma-separated values
- **Quotes**: Properly quoted values for fields containing commas

## Known Limitations

### MCP Server

1. **No Rate Limiting**: Rate limiting not implemented (see Rate Limiting section)
2. **No WebSocket Support**: Real-time data requires polling
3. **Token Expiration**: Access tokens expire daily, require re-authentication
4. **Single Process**: Not designed for horizontal scaling

### Web Application

1. **No Real-time Updates**: Data must be manually refreshed
2. **Limited Caching**: No caching implemented for frequently accessed data
3. **XIRR Performance**: Can be slow for large portfolios
4. **CSV Import**: Large files may cause memory issues
5. **No Backup System**: No automated backup system
6. **Limited Error Recovery**: Some errors may require manual intervention

### Database

1. **No Soft Deletes**: Deleted records are permanently removed
2. **No Audit Trail**: No comprehensive audit logging
3. **No Data Archival**: Old data is not automatically archived

<!-- TODO: [GAP] Add roadmap for addressing known limitations -->

## Best Practices

### Development

1. **TypeScript**: Use TypeScript for type safety
2. **Error Handling**: Always handle errors gracefully
3. **Logging**: Log important events and errors
4. **Testing**: Write tests for critical functionality
5. **Code Review**: Review code before merging

### Database

1. **Prepared Statements**: Always use prepared statements
2. **Transactions**: Use transactions for multi-step operations
3. **Indexes**: Add indexes for frequently queried columns
4. **Backups**: Regular database backups
5. **Migrations**: Use migrations for schema changes

### API Design

1. **RESTful**: Follow RESTful principles
2. **Error Responses**: Consistent error response format
3. **Validation**: Validate all inputs
4. **Documentation**: Document all API endpoints
5. **Versioning**: Consider API versioning for future changes

### Security

1. **Secrets**: Never commit secrets to version control
2. **HTTPS**: Use HTTPS in production
3. **Authentication**: Require authentication for protected routes
4. **Authorization**: Check permissions for all operations
5. **Input Validation**: Validate and sanitize all inputs

### Performance

1. **Pagination**: Use pagination for large result sets
2. **Caching**: Cache frequently accessed data
3. **Database Queries**: Optimize database queries
4. **Async Operations**: Use async/await for I/O operations
5. **Monitoring**: Monitor application performance

## Gap Identification

The following areas require additional documentation or implementation:

1. **Production Deployment Checklist**: Step-by-step production deployment guide
2. **Monitoring Setup**: Application monitoring and alerting setup
3. **Backup Strategies**: Database backup and recovery procedures
4. **Disaster Recovery**: Disaster recovery plan and procedures
5. **Security Audit**: Comprehensive security audit checklist
6. **Performance Testing**: Performance testing procedures and benchmarks
7. **Load Testing**: Load testing strategies and results
8. **Scalability Planning**: Horizontal scaling strategies
9. **Compliance**: Regulatory compliance requirements (GDPR, etc.)
10. **Documentation Updates**: Process for keeping documentation up to date

## Additional Resources

- [Kite Connect API Documentation](https://kite.trade/docs/connect/v3/)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Support and Maintenance

<!-- TODO: [GAP] Add support contact information and maintenance procedures -->

**For Issues**:
- Check existing documentation
- Review error logs
- Contact development team

**For Kite API Issues**:
- Contact [Zerodha Support](https://support.zerodha.com/)

**For MCP Server Issues**:
- Open an issue on the repository
- Check MCP SDK documentation

