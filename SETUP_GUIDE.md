# Real Estate Aggregator MX - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis (optional, for caching)
- Docker and Docker Compose (optional, for containerized setup)

## Quick Start

### 1. Clone and Install

```bash
cd real-estate-aggregator-mx
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

### 3. Database Setup

#### Option A: Using existing PostgreSQL
```bash
# Create database
createdb real_estate_db

# Run migrations
cd apps/api
npm run db:migrate
```

#### Option B: Using Docker
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
npm run db:migrate
```

### 4. Run Development Servers

#### All services at once:
```bash
npm run dev
```

#### Individual services:
```bash
# API server (port 3001)
npm run api:dev

# Web frontend (port 3000)
npm run web:dev

# Scraper service
npm run scraper:dev
```

## Docker Setup (Production-like)

```bash
# Build and run all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Project Structure

```
real-estate-aggregator-mx/
├── apps/
│   ├── api/          # Express REST API
│   ├── web/          # Next.js frontend
│   └── scraper/      # Web scraping service
├── packages/
│   ├── database/     # Shared database utilities
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
└── infrastructure/
    └── docker/       # Docker configurations
```

## Available Scripts

### Root Level (Monorepo)
- `npm run dev` - Run all apps in development
- `npm run build` - Build all apps
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run typecheck` - Type check all TypeScript
- `npm run format` - Format code with Prettier

### Database
- `npm run db:migrate` - Run database migrations
- `npm run db:migrate:create` - Create new migration

### Individual Apps
- `npm run api:dev` - Run API only
- `npm run web:dev` - Run frontend only
- `npm run scraper:dev` - Run scraper only

## Environment Variables

### API Configuration
- `NODE_ENV` - Environment (development/production)
- `PORT` - API port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `ADMIN_API_KEY` - Admin endpoints API key

### Frontend Configuration
- `NEXT_PUBLIC_API_URL` - API base URL

### Scraper Configuration
- `ENABLE_SCHEDULED_SCRAPING` - Enable cron jobs
- `SCRAPINGBEE_API_KEY` - ScrapingBee API key
- `SCRAPEDO_API_KEY` - Scrapedo API key

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Building for Production

```bash
# Build all apps
npm run build

# Build specific app
npm run build --filter=@aggregator/api
```

## Deployment

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

### Using Docker
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database Connection Issues
1. Check PostgreSQL is running
2. Verify credentials in .env
3. Ensure database exists
4. Check firewall/network settings

### Build Errors
```bash
# Clean and rebuild
npm run clean
rm -rf node_modules
npm install
npm run build
```

## Contributing

1. Create feature branch
2. Make changes
3. Run tests and linting
4. Submit pull request

## Support

For issues and questions:
- Check existing issues on GitHub
- Review documentation
- Contact development team