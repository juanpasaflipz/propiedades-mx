# Database Setup Guide

This guide will help you set up the database connection for your real estate aggregator.

## Prerequisites

- PostgreSQL installed locally or access to a PostgreSQL database (e.g., Railway, Supabase, Neon, etc.)
- Node.js and npm installed

## Step 1: Set up Environment Variables

### For the API (Backend)

Create a `.env` file in the `apps/api` directory:

```bash
cd apps/api
cp ../../.env.example .env
```

Edit `apps/api/.env` and update the database connection:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/real_estate_db

# Or if using Railway/Cloud service:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.railway.app:PORT/railway

# API Port
PORT=3003
NODE_ENV=development
```

### For the Web App (Frontend)

Create a `.env.local` file in the `apps/web` directory:

```bash
cd apps/web
touch .env.local
```

Add the following to `apps/web/.env.local`:

```env
# API URL - points to your backend
NEXT_PUBLIC_API_URL=http://localhost:3003

# AI Configuration (you already have this in Railway)
CLAUDE_API_KEY=your_claude_api_key
```

## Step 2: Create the Database

### Option A: Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Create database
createdb real_estate_db

# Or using psql
psql -U postgres
CREATE DATABASE real_estate_db;
\q
```

### Option B: Using Railway (Recommended)

Since you're already using Railway:

1. Go to your Railway project
2. Add a PostgreSQL service if you haven't already
3. Copy the connection string from the service
4. It will look like: `postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway`

## Step 3: Run Database Migrations

```bash
# From the root directory
cd apps/api

# Run the migration
psql $DATABASE_URL -f src/db/migrations/001_initial_schema.sql

# Or if you prefer using npm script
npm run db:migrate
```

## Step 4: Verify Database Setup

Test the database connection:

```bash
# Start the API server
cd apps/api
npm run dev
```

Then visit: http://localhost:3003/api/health

You should see a response with database status "connected".

## Step 5: Start All Services

From the root directory:

```bash
# Start both API and Web app
npm run dev:all

# Or start them separately:
# Terminal 1
cd apps/api && npm run dev

# Terminal 2
cd apps/web && npm run dev
```

## Step 6: Test the Setup

1. Visit http://localhost:3000
2. Try searching for properties
3. Check the browser console - you should see:
   - "Trying provider: searchBackendAPI"
   - Network requests to http://localhost:3003/api/properties/search

## Troubleshooting

### Database Connection Issues

If you see "Backend API error" in the console:

1. Check that the API is running on port 3003
2. Verify DATABASE_URL is correct in `apps/api/.env`
3. Test the connection directly:

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM properties;"
```

### No Properties Found

If the database is empty, you'll need to:

1. Add some test data manually
2. Or run the scraper to populate properties
3. Or the system will fall back to mock data

### CORS Issues

If you see CORS errors, make sure the API's CORS configuration includes your frontend URL:

- Check `apps/api/src/server.ts` line 27-30
- Add your frontend URL to the allowed origins

## Quick Setup (Automated)

We've created a setup script to automate the process:

```bash
# From the root directory
./setup-database.sh
```

This script will:
1. Check your environment variables
2. Create necessary .env files
3. Run database migrations
4. Test the connection

## Adding Test Data

To populate your database with sample properties:

```bash
# From the root directory
psql $DATABASE_URL -f apps/api/src/db/seed-data.sql

# Or using your database client
# The seed file contains 10 sample properties in various Mexican cities
```

The seed data includes properties in:
- Polanco, CDMX (apartments and houses)
- Condesa, CDMX (lofts and colonial houses)
- Roma Norte, CDMX (renovated apartments)
- Playa del Carmen (beach condos)
- Tulum (eco-chic houses)
- Guadalajara (modern lofts)
- Monterrey (family houses)

## Next Steps

Once connected to the real database:

1. The AI search will query actual properties
2. Results will be filtered based on your natural language queries
3. You can add more properties via:
   - Manual SQL inserts
   - API endpoints
   - Web scraping services