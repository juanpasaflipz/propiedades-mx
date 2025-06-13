# Development Quick Start

## Current Status
✅ Dependencies installed
✅ Environment variables configured
✅ Frontend and API can run
❌ PostgreSQL needs to be set up

## To Start Development

### Option 1: Run All Services (Recommended)
Open 3 terminal tabs/windows:

**Terminal 1 - Frontend:**
```bash
cd real-estate-aggregator-mx
npm run web:dev
```
→ Frontend will run at http://localhost:3000

**Terminal 2 - API:**
```bash
cd real-estate-aggregator-mx
npm run api:dev
```
→ API will run at http://localhost:3003

**Terminal 3 - Scraper (optional):**
```bash
cd real-estate-aggregator-mx
npm run scraper:dev
```

### Option 2: Use a Process Manager
Install PM2 globally:
```bash
npm install -g pm2
```

Create start script:
```bash
pm2 start npm --name "web" -- run web:dev
pm2 start npm --name "api" -- run api:dev
pm2 logs
```

## Database Setup Required

Before the API can fully work, you need PostgreSQL:

### Quick Setup with Docker:
1. Install Docker Desktop from https://docker.com
2. Start Docker Desktop
3. Run:
```bash
docker-compose up -d postgres redis
npm run db:migrate
```

### Or Install PostgreSQL locally:
```bash
# macOS with Homebrew
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb real_estate_db

# Run migrations
cd apps/api
npm run db:migrate
```

## Testing the Setup

1. Frontend health check:
   - Open http://localhost:3000
   - You should see the Next.js app

2. API health check:
   ```bash
   curl http://localhost:3003/health
   ```

## Current Features Available

### Without Database:
- ✅ Frontend UI and navigation
- ✅ API health endpoint
- ✅ Static pages

### With Database:
- Property search
- Property details
- Admin panel
- Scraping functionality

## Next Development Steps

1. **Set up PostgreSQL** (required for full functionality)
2. **Create test data** in the database
3. **Test property search** functionality
4. **Configure scrapers** (optional)
5. **Start building new features!**

## Troubleshooting

### Port already in use:
```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
lsof -ti:3003 | xargs kill -9
```

### TypeScript errors:
```bash
npm run typecheck
```

### Clean rebuild:
```bash
npm run clean
npm install
npm run build
```