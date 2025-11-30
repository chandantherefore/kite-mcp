# Build and Run

## MCP Server

### Development Mode
Watch for changes and rebuild automatically:
```bash
# From project root
npm run dev
```

### Build
Compile TypeScript to JavaScript (output in `dist/`):
```bash
npm run build
```

### Run
Start the server directly (usually done by the MCP Client, e.g., Claude):
```bash
npm start
# OR
node dist/index.js
```

### Claude Desktop Integration
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "kite": {
      "command": "node",
      "args": ["/absolute/path/to/kite-mcp/dist/index.js"]
    }
  }
}
```

## Portfolio Manager (Next.js App)

### Development Mode
Run the development server with hot-reloading:
```bash
# From kite-client-app/
npm run dev
```
Access the app at `http://localhost:3000`.

### Production Build
Create an optimized production build:
```bash
npm run build
```

### Run Production Server
Start the built application:
```bash
npm start
```

### Linting
Check for code issues:
```bash
npm run lint
```

