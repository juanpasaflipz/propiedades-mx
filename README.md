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

# Run development
npm run dev
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Express, TypeScript, PostgreSQL
- **Infrastructure**: Docker, PM2, Nginx
- **Services**: Redis (cache), ScrapingBee (proxy)

## Features

- 🏠 Property search across Mexico
- 🔍 Advanced filtering and search
- 🗺️ Interactive maps
- 📱 Mobile responsive
- 🤖 AI-powered search (MCP)
- 🕷️ Automated scraping
- 💾 Caching and optimization
- 🔒 Secure admin panel

## Development

This is a monorepo managed with [tool] containing:
- Web application
- REST API
- Scraping services
- Shared packages

See individual app READMEs for specific details.