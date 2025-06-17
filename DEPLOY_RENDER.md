# Deploying Backend to Render

## Step-by-Step Guide

### 1. Push Latest Code to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Create Render Account
1. Go to [https://render.com](https://render.com)
2. Sign up or log in

### 3. Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `juanpasaflipz/propiedades-mx`
3. Configure the service:
   - **Name**: `real-estate-aggregator-api`
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Root Directory**: Leave blank (we'll use render.yaml)
   - **Runtime**: Node
   - **Build Command**: `cd apps/api && npm install && npm run build`
   - **Start Command**: `node apps/api/dist/server.js`

### 4. Add Environment Variables
In the Render dashboard, add these environment variables:

```
DATABASE_URL=postgresql://postgres:rnj@vmc@QER8xnz1vpq@db.pfpyfxspinghdhrjalsg.supabase.co:5432/postgres
CLAUDE_API_KEY=[Your Claude API Key]
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=3003
```

### 5. Deploy
1. Click "Create Web Service"
2. Wait for the build and deployment to complete
3. Your API will be available at: `https://real-estate-aggregator-api.onrender.com`

### 6. Update Vercel Environment
1. Go to your Vercel project settings
2. Update environment variables:
   - `NEXT_PUBLIC_API_URL=https://real-estate-aggregator-api.onrender.com`
3. Redeploy your Vercel app

## Health Check
Once deployed, test your API:
- Health endpoint: `https://real-estate-aggregator-api.onrender.com/health`
- API test: `https://real-estate-aggregator-api.onrender.com/api/properties/search`

## Troubleshooting
- Check logs in Render dashboard
- Ensure all environment variables are set
- Verify database connection (SSL settings are already configured)
- The free tier may sleep after inactivity - first request may be slow