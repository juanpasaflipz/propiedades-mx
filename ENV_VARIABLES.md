# Environment Variables Documentation

## Backend API (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string for Supabase | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` |
| `CLAUDE_API_KEY` | Claude API key for AI search | `sk-ant-api03-...` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3003` |

## Frontend Web App (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://real-estate-aggregator-api.onrender.com` |
| `NEXTAUTH_URL` | NextAuth callback URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | Generate with: `openssl rand -base64 32` |
| `DATABASE_URL` | PostgreSQL connection string | Same as backend |

## Local Development (.env.local files)

### Backend (`apps/api/.env.local`)
```env
DATABASE_URL=postgresql://postgres:rnj@vmc@QER8xnz1vpq@db.pfpyfxspinghdhrjalsg.supabase.co:5432/postgres
CLAUDE_API_KEY=your-claude-api-key
NODE_ENV=development
PORT=3003
FRONTEND_URL=http://localhost:3000
```

### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3003
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret
DATABASE_URL=postgresql://postgres:rnj@vmc@QER8xnz1vpq@db.pfpyfxspinghdhrjalsg.supabase.co:5432/postgres
```

## Security Notes
- Never commit `.env.local` files
- Always use different `NEXTAUTH_SECRET` for production
- Keep `CLAUDE_API_KEY` secure and rotate if exposed
- Use environment-specific database credentials when possible