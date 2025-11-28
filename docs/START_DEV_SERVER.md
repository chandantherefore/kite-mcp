# Starting the Development Server

## Clean Start (Recommended)

If you encounter module errors like "Cannot find module './948.js'", do a clean rebuild:

```bash
cd kite-client-app
rm -rf .next
npm run dev
```

## Normal Start

```bash
cd kite-client-app
npm run dev
```

Then open: `http://localhost:3000`

## If You Still See Errors

1. **Clear Node modules and reinstall**:
```bash
cd kite-client-app
rm -rf node_modules package-lock.json
npm install
npm run dev
```

2. **Check .env.local**:
Make sure you have `.env.local` in the root directory (not in kite-client-app):
```bash
# Should be at: /path/to/kite-mcp/.env.local
KITE_ACC_1_ID=father
KITE_ACC_1_NAME=Dad's Portfolio
KITE_ACC_1_KEY=your_api_key
KITE_ACC_1_SECRET=your_api_secret
```

3. **Rebuild the MCP server first**:
```bash
cd /path/to/kite-mcp
npm run build
```

## Verify It's Working

1. Open browser to `http://localhost:3000`
2. You should see the login page with instructions
3. Click "Go to Dashboard" - you should see the dashboard (may show empty data until authenticated)
4. Test API: `http://localhost:3000/api/kite/accounts` - should return list of configured accounts

## Common Issues

### "Cannot find module" errors
- **Solution**: Delete `.next` folder and restart

### "Module not found: Can't resolve 'bufferutil'"
- **Not a problem**: These are optional performance dependencies for WebSocket
- They don't affect functionality
- You can ignore these warnings

### API returns authentication errors
- **Solution**: You need to authenticate first via the login flow
- Each account needs: login → authorize → generate_session

### Port 3000 already in use
```bash
# Find process
lsof -i :3000
# Kill it
kill -9 <PID>
# Or use different port
PORT=3001 npm run dev
```

## Development Workflow

1. Make sure `.env.local` is configured
2. Build MCP server: `npm run build` (in root)
3. Start Next.js: `cd kite-client-app && npm run dev`
4. Open browser: `http://localhost:3000`
5. Authenticate accounts (see QUICK_START.md)
6. View portfolio at `/portfolio`

