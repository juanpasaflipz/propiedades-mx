# MCP Integration Deployment Notes

## Environment Variables
No new environment variables needed - uses existing DATABASE_URL

## Deployment Steps

### For Render.com or similar:
1. Ensure the build command includes npm install to get new dependencies
2. The postgres-mcp-server will be installed as an npm dependency
3. No additional services needed - MCP runs within the Express API

### For Docker:
The existing Dockerfile should work as-is since dependencies are in package.json

### Database Requirements:
- PostgreSQL with pgvector extension (already configured)
- No schema changes required
- MCP provides read-only access to existing tables

## Verification Steps Post-Deployment:

1. Check API health endpoint: `GET /api/health`
2. Test MCP connection: `GET /api/mcp/health` (requires auth)
3. Verify schema endpoint: `GET /api/mcp/schema` (requires auth)

## Rollback Plan:
If issues occur, simply revert the deployment. The changes are isolated to new endpoints and don't modify existing functionality.

## Performance Considerations:
- MCP maintains a persistent connection to PostgreSQL
- Connection pooling is handled by the existing pg configuration
- Read-only queries ensure no performance impact on writes

## Security Notes:
- All MCP endpoints require authentication
- Only SELECT queries are allowed
- Additional query validation prevents any write operations