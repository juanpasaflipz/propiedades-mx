# MCP (Model Context Protocol) Setup

This project includes integration with MCP servers for enhanced AI capabilities.

## Available MCP Servers

### 1. PostgreSQL MCP Server
Provides direct database access for AI models to query and analyze property data.

- **Purpose**: Database queries, schema exploration, and data analysis
- **Configuration**: Uses your DATABASE_URL environment variable

### 2. Context7 MCP Server
Provides up-to-date documentation for libraries and frameworks used in the project.

- **Purpose**: Real-time documentation access for better code generation
- **Usage**: Include "use context7" in your prompts to get current docs

## Installation for Claude Desktop

### Option 1: Using Smithery CLI (Recommended)

```bash
# Install PostgreSQL MCP server
npx -y @smithery/cli install @modelcontextprotocol/server-postgres --client claude

# Install Context7 MCP server
npx -y @smithery/cli install @upstash/context7-mcp --client claude
```

### Option 2: Manual Configuration

1. Locate your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add the following to your configuration:

```json
{
  "mcpServers": {
    "postgres-propiedades": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "YOUR_DATABASE_URL_HERE"
      ]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

3. Replace `YOUR_DATABASE_URL_HERE` with your actual PostgreSQL connection string.

4. Restart Claude Desktop

## Installation for Cursor

1. Edit `~/.cursor/mcp.json` (create if it doesn't exist)

2. Add the configuration:

```json
{
  "mcpServers": {
    "postgres-propiedades": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "YOUR_DATABASE_URL_HERE"
      ]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

3. Restart Cursor

## Using MCP in the Application

The API includes MCP integration endpoints:

### PostgreSQL MCP Endpoints
- `GET /api/mcp/schema` - Get database schema information
- `POST /api/mcp/query` - Execute read-only SQL queries
- `POST /api/mcp/search/natural` - Natural language property search
- `GET /api/mcp/health` - Database health metrics
- `GET /api/mcp/insights/properties/:id` - Property insights with similar properties

### Context7 MCP Endpoints
- `POST /api/context7/documentation` - Get documentation for a specific library
- `POST /api/context7/enhanced-search` - Property search with documentation context
- `GET /api/context7/libraries` - List supported libraries

## Example Usage

### With Claude Desktop
Once configured, you can use these features in Claude:

1. **Database queries**: "Query the properties table to find all properties in Mexico City"
2. **Documentation**: "use context7 nextjs: how to implement server components"
3. **Combined**: "use context7 pgvector: help me implement vector similarity search for properties"

### With the API
```javascript
// Get database schema
const response = await fetch('/api/mcp/schema', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

// Get React documentation
const docs = await fetch('/api/context7/documentation', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    library: 'react',
    query: 'hooks'
  })
});
```

## Troubleshooting

1. **MCP not connecting**: Ensure your DATABASE_URL is correct and the database is accessible
2. **Context7 not working**: Make sure you have internet connection for fetching documentation
3. **Permission errors**: Check that the MCP servers have necessary permissions to run

## Security Notes

- The PostgreSQL MCP server only allows read-only queries through the API
- Authentication is required for all MCP endpoints
- Database credentials should never be exposed in client-side code