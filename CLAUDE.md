# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Real Estate Aggregator MX

A production-ready Mexican Real Estate Aggregator platform with AI-powered search, automated scraping, and comprehensive monitoring.

## Architecture Overview

### Monorepo Structure (Turbo)
- **apps/web**: Next.js 15 frontend with App Router
- **apps/api**: Express.js REST API with TypeScript
- **apps/scraper**: Property scraping orchestrator
- **packages/**: Shared code (types, database, UI components)
- **services/**: Additional services (MCP server, future Telegram bot)

### Key Architectural Patterns

**1. Authentication Architecture**
- JWT dual-token system (access: 15min, refresh: 7d)
- Refresh tokens stored in database with expiration tracking
- Middleware chain: `requireAuth` → `requireAdmin` → `optionalAuth`
- Lazy dependency injection to avoid circular dependencies
- Password hashing with bcrypt (12 rounds)

**2. Database Design (PostgreSQL + pgvector)**
- Incremental migration system (numbered SQL files)
- Vector embeddings for AI-powered semantic search
- Automatic timestamps via database triggers
- Foreign key constraints with cascading deletes
- Connection pooling with SSL support

**3. API Layer Patterns**
- Controller → Service → Database layer separation
- Dependency injection container for service management
- Comprehensive middleware stack (security, monitoring, rate limiting)
- Error handling with Sentry integration
- API usage monitoring and analytics

**4. Frontend Architecture**
- Server Components by default, Client Components for interactivity
- React Context for auth and favorites state
- Custom hooks for data fetching patterns
- Axios with automatic auth header injection
- TypeScript with strict mode enabled

**5. Scraper System**
- Base scraper class with circuit breaker pattern
- Orchestrator for managing multiple scrapers
- Rate limiting and retry logic per source
- Transaction batching for performance
- Fault tolerance with exponential backoff

## Development Commands

### Quick Start
```bash
# Install all dependencies
npm install

# Run all services in development
npm run dev

# Run specific services
npm run web:dev      # Frontend only
npm run api:dev      # API only  
npm run scraper:dev  # Scraper only
```

### Database Operations
```bash
# Run migrations (from api directory)
cd apps/api && node scripts/migrate.js

# Create new migration
cd apps/api && node scripts/create-migration.js <name>

# Generate password hash for manual user creation
cd apps/api && node scripts/generate-password-hash.js <password>

# Check admin user
cd apps/api && node scripts/check-admin.js
```

### Testing
```bash
# Run all tests
npm test

# Run specific app tests
cd apps/api && npm test
cd apps/web && npm test

# Run single test file
npm test -- path/to/test.ts

# Run tests in watch mode
npm test -- --watch
```

### Code Quality
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

### Build & Deploy
```bash
# Build all apps
npm run build

# Clean everything
npm run clean

# Docker local development
docker-compose up

# Production build
docker build -f infrastructure/docker/Dockerfile.api -t api .
```

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentication
JWT_SECRET=<32+ characters>
JWT_REFRESH_SECRET=<32+ characters>
NEXTAUTH_SECRET=<for frontend>
NEXTAUTH_URL=http://localhost:3000

# APIs
OPENAI_API_KEY=<for AI features>
SCRAPE_DO_TOKEN=<for scraping>
```

### Optional Services
```bash
REDIS_URL=<for caching>
SENTRY_DSN=<for error tracking>
CLAUDE_API_KEY=<for MCP integration>
```

## API Endpoints

### Public Endpoints
- `GET /api/properties` - Search with filters
- `GET /api/properties/:id` - Property details
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token

### Protected Endpoints
- `GET /api/properties/favorites` - User favorites
- `POST /api/properties/:id/favorite` - Toggle favorite
- `GET /api/ai/search` - AI-powered search

### Admin Endpoints
- `GET /api/admin/dashboard` - System metrics
- `POST /api/admin/scraper/trigger` - Manual scrape
- `GET /api/admin/api-usage` - API analytics

## Database Schema

### Core Tables
- `properties` - Main property data with location, pricing, features
- `users` - User accounts with role-based access
- `refresh_tokens` - JWT refresh token storage
- `property_embeddings` - Vector embeddings for AI search
- `api_usage` - API monitoring and analytics
- `scraper_runs` - Scraping job monitoring

### Key Relationships
- Properties ↔ Embeddings (1:1)
- Users ↔ Refresh Tokens (1:N)
- Properties ↔ Favorites (M:N through user_properties)

## Testing Approach

### Unit Tests
- Services tested with mocked dependencies
- Database operations mocked for isolation
- JWT utilities with test tokens

### Integration Tests
- API routes with supertest
- Database transactions in test mode
- Authentication flow end-to-end

### Frontend Tests
- Components with React Testing Library
- Custom hooks with renderHook
- Mock service worker for API calls

## Deployment Configurations

### Render (render.yaml)
- Web service for API
- Static site for frontend
- Background worker for scraper
- PostgreSQL database

### Docker Compose
- Multi-stage builds for optimization
- Service dependencies defined
- Volume mounts for development
- Network isolation

### Environment-Specific Settings
- Development: Relaxed rate limits, verbose logging
- Production: Strict security, error tracking, caching

## Security Considerations

### API Security
- Helmet.js for security headers
- CORS with whitelist
- Rate limiting per IP
- Input validation with Zod
- SQL injection prevention via parameterized queries

### Authentication
- No default credentials
- Secure password requirements
- Token rotation strategy
- Role-based access control

## Performance Optimizations

### Database
- Connection pooling (max 20 connections)
- Indexed columns for search
- Vector indexes for AI search
- Query optimization with EXPLAIN

### API
- Redis caching (when available)
- Response compression
- Pagination with cursor-based approach
- Batch operations for bulk updates

### Frontend
- Server-side rendering by default
- Image optimization with Next.js
- Code splitting per route
- Prefetching for navigation

## Monitoring & Debugging

### Logging
- Structured JSON logs
- Request ID tracking
- Performance metrics
- Error stack traces

### Health Checks
- `/api/health` - Basic health
- `/api/health/db` - Database connectivity
- `/api/health/redis` - Cache status

### Admin Dashboard
- Real-time metrics
- Scraper status
- API usage graphs
- Database health

## Common Development Patterns

### Adding New API Endpoint
1. Define route in `apps/api/src/routes/`
2. Create controller method
3. Implement service logic
4. Add validation schema
5. Write tests
6. Update API documentation

### Adding New Scraper
1. Extend `BaseScraper` class
2. Implement `scrapeProperties` method
3. Add to orchestrator configuration
4. Test with mock data
5. Monitor performance

### Database Migration
1. Create migration file with timestamp
2. Write up/down SQL
3. Test locally
4. Run migration
5. Update TypeScript types

## Troubleshooting

### Common Issues
- **Auth failures**: Check JWT secrets match
- **Database errors**: Verify DATABASE_URL and SSL mode
- **Scraping failures**: Check proxy credentials
- **Build errors**: Clear cache with `npm run clean`

### Debug Commands
```bash
# Check database connection
cd apps/api && node test-db-connection.js

# Verify admin user
cd apps/api && node scripts/check-admin.js

# Test scraper
cd apps/scraper && node test-scrapedo.js
```

## MCP Integration

The project includes Model Context Protocol (MCP) integration:

### Available MCP Servers
- **PostgreSQL MCP**: Database queries and schema exploration (`/api/mcp/*`)
- **Context7 MCP**: Up-to-date documentation for libraries (`/api/context7/*`)

### Configuration
See `MCP_SETUP.md` for detailed setup instructions for Claude Desktop, Cursor, and API usage.

### Usage Examples
- Database queries: "Query properties in Mexico City with price < 1000000"
- Documentation: "use context7 nextjs: how to implement server components"
- Combined: "use context7 pgvector: implement vector similarity search"