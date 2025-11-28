graph TD

    %% ------- Browser (Client) -------
    subgraph Browser_Client["Browser (Client)"]
        Login[Login Page]
        Dash[Dashboard]
        Store[Zustand Store]

        Login -->|1. Enter API Keys| API_Auth
        API_Auth -->|2. Redirect URL| Login
        Login -->|3. Send Request Token| API_Session

        Dash -->|Fetch Data| API_Execute
        API_Execute -->|Return Data| Store
        Store -->|Update UI| Dash
    end

    %% ------- Next.js Server (Backend) -------
    subgraph Next_Server["Next.js Server (Backend)"]
        API_Auth[POST /api/kite/auth]
        API_Session[POST /api/kite/session]
        API_Execute[POST /api/kite/execute]

        KiteService[Kite Service Wrapper]

        API_Auth --> KiteService
        API_Session --> KiteService
        API_Execute --> KiteService
    end

    %% ------- Kite MCP Server (Library) -------
    subgraph MCP_Server["Kite MCP Server (Library)"]
        MCP[KiteMCPServer Class]
        Creds[FileSystem Credentials]

        KiteService -->|callTool login| MCP
        KiteService -->|callTool generate_session| MCP
        KiteService -->|callTool get_holdings| MCP

        MCP -->|Read/Write| Creds
    end

    %% ------- External -------
    subgraph External["External"]
        Zerodha[Zerodha Kite API]
        MCP -->|HTTP Requests| Zerodha
    end