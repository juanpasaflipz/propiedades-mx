# Real Estate Aggregator MX

Consolidated Mexican Real Estate Aggregator platform combining the best features from multiple repositories.

## Project Structure

```
real-estate-aggregator-mx/
├── apps/
│   ├── web/                 # Next.js frontend application
│   ├── api/                 # Express REST API server
│   └── scraper/            # Scraping service
├── packages/
│   ├── database/           # Shared database schemas and migrations
│   ├── types/              # Shared TypeScript types
│   └── ui/                 # Shared UI components
├── services/
│   ├── mcp-server/         # MCP/Claude integration
│   └── telegram-bot/       # Telegram mini app (future)
└── infrastructure/
    ├── docker/             # Docker configurations
    └── scripts/            # Deployment and utility scripts
```

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env and add your Supabase DATABASE_URL and other required keys

# Run database migrations
cd apps/api && node scripts/migrate.js

# Run development
npm run dev
```

## Database Setup (Supabase)

1. Create a new project on [Supabase](https://supabase.com)
2. Copy your database URL from Settings > Database
3. Update DATABASE_URL in all .env files with format:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
4. Run migrations: `cd apps/api && node scripts/migrate.js`

## Default Admin Access

- Email: admin@realestate.mx
- Password: admin123
- **Important**: Change this password immediately in production!

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Express, TypeScript, PostgreSQL (Supabase)
- **Authentication**: NextAuth.js (frontend), JWT (API)
- **Infrastructure**: Docker, PM2, Nginx
- **Services**: Redis (cache), ScrapingBee/Scrape.do (proxy), Claude AI

## Features

- 🏠 Property search across Mexico
- 🔍 Advanced filtering and search
- 🗺️ Interactive maps
- 📱 Mobile responsive
- 🤖 AI-powered natural language search
- 🔐 Secure authentication (login/register)
- 🕷️ Automated scraping
- 💾 Caching and optimization
- 🔒 Protected admin panel
- ✅ Input validation with Zod

## Development

This is a monorepo managed with [tool] containing:
- Web application
- REST API
- Scraping services
- Shared packages

See individual app READMEs for specific details.