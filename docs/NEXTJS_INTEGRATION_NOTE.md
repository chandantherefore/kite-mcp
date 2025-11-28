# Next.js Integration Note

## Issue

The MCP server (`src/index.ts`) cannot be directly imported into Next.js pages/API routes because:

1. **Build-time execution**: Next.js tries to execute imports during static generation
2. **WebSocket dependencies**: KiteConnect uses `ws` package which doesn't work in browser/edge runtime
3. **Module resolution**: The MCP server is designed to run as a standalone Node.js process

## Current Status

✅ **MCP Server**: Fully functional for Claude Desktop / MCP clients  
❌ **Next.js Integration**: Needs architectural changes

## Recommended Solutions

### Option 1: Direct KiteConnect SDK in API Routes (Recommended)

Instead of using the MCP server in Next.js, use the KiteConnect SDK directly in API routes:

```typescript
// kite-client-app/lib/kite-service.ts
import { KiteConnect } from 'kiteconnect';
import { loadAccountsConfig } from '../../dist/config.js';

const sessions = new Map<string, KiteConnect>();

export function initializeSession(clientId: string, apiKey: string, apiSecret: string, accessToken?: string) {
  const kc = new KiteConnect({ api_key: apiKey });
  if (accessToken) {
    kc.setAccessToken(accessToken);
  }
  sessions.set(clientId, kc);
  return kc;
}

export function getSession(clientId: string) {
  return sessions.get(clientId);
}

export async function executeKiteTool(tool: string, args: any = {}) {
  const session = getSession(args.client_id);
  if (!session) {
    throw new Error('Not authenticated');
  }
  
  switch (tool) {
    case 'get_holdings':
      return await session.getHoldings();
    case 'get_mf_holdings':
      return await session.getMFHoldings();
    // ... implement other methods
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}
```

**Pros:**
- Clean architecture
- No build issues
- Full control over session management
- Works with Next.js 14

**Cons:**
- Need to reimplement MCP tool logic
- Duplicate code between MCP server and Next.js

### Option 2: Separate MCP Server Process

Run the MCP server as a separate process and communicate via HTTP/IPC:

```typescript
// Start MCP server on port 3001
// kite-client-app makes HTTP requests to localhost:3001

export async function executeKiteTool(tool: string, args: any = {}) {
  const response = await fetch('http://localhost:3001/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, args }),
  });
  return await response.json();
}
```

**Pros:**
- Reuse MCP server code
- Clean separation of concerns

**Cons:**
- More complex deployment
- Need to manage two processes
- Requires adding HTTP server to MCP

### Option 3: API-only Mode for MCP Server

Create a Node.js API server that wraps the MCP server:

```typescript
// server/api.ts
import express from 'express';
import { KiteMCPServer } from '../dist/index.js';

const app = express();
const mcpServer = new KiteMCPServer();

app.post('/api/execute', async (req, res) => {
  const { tool, args } = req.body;
  const result = await mcpServer.callTool(tool, args);
  res.json(result);
});

app.listen(3001);
```

Then Next.js API routes proxy to this:

```typescript
// kite-client-app/app/api/kite/execute/route.ts
export async function POST(req) {
  const body = await req.json();
  const response = await fetch('http://localhost:3001/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response;
}
```

## Immediate Next Steps

1. **For MCP/Chatbot Usage**: ✅ Already works - use the compiled `dist/index.js` with Claude Desktop

2. **For Web Dashboard**: Choose Option 1 (Recommended)
   - Implement `kite-client-app/lib/kite-service.ts` with direct KiteConnect SDK
   - Copy session management logic from MCP server
   - Implement each tool method

3. **Or**: Use Option 2/3 if you want to reuse the MCP server code

## Implementation Guide for Option 1

### Step 1: Create Kite Service with Direct SDK

```bash
cd kite-client-app
npm install kiteconnect
```

Then implement `lib/kite-service.ts` with the KiteConnect SDK directly.

### Step 2: Update API Routes

API routes should use the new service:

```typescript
// app/api/kite/execute/route.ts
import { executeKiteTool } from '@/lib/kite-service';

export async function POST(req) {
  const { tool, args } = await req.json();
  const result = await executeKiteTool(tool, args);
  return NextResponse.json(result);
}
```

### Step 3: Session Management

Store sessions in-memory or use a database:

```typescript
// Optionally persist to file like MCP server does
import { promises as fs } from 'fs';
const SESSIONS_FILE = '.next-kite-sessions.json';

async function loadSessions() {
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveSessions(sessions: Record<string, any>) {
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}
```

## Current Workaround

The MCP server is fully functional for:
- ✅ Claude Desktop integration
- ✅ Standalone MCP clients
- ✅ Chatbot interactions

For the web dashboard, you can:
1. Use the MCP tools via chatbot to authenticate accounts
2. Then view the data in the dashboard after implementing Option 1

## Files to Update

If implementing Option 1:
- `kite-client-app/lib/kite-service.ts` - Direct KiteConnect SDK
- `kite-client-app/app/api/kite/auth/route.ts` - Use new service
- `kite-client-app/app/api/kite/execute/route.ts` - Use new service
- `kite-client-app/app/api/kite/accounts/route.ts` - Use config directly

## Summary

**The MCP server works perfectly for its intended purpose** (Claude Desktop / MCP protocol).

For Next.js web dashboard, we need a different approach because Next.js doesn't support importing Node.js-only code during SSG/build.

**Recommended**: Implement Option 1 (Direct SDK in API routes) - cleanest for Next.js architecture.

