# AI-Powered Natural Language Search Setup

## Overview
The Real Estate Aggregator MX now supports natural language search powered by Claude AI. Users can search for properties using conversational queries in Spanish or English.

## Configuration

### Local Development
Add the following to your `apps/web/.env.local`:
```env
CLAUDE_API_KEY=your_actual_claude_api_key
```

### Production (Railway)
Add the same environment variable to your Railway service:
1. Go to Railway dashboard
2. Select your web service
3. Navigate to Variables tab
4. Add `CLAUDE_API_KEY` with your API key value

## Features

The AI search understands queries like:
- "Casa en Polanco con 3 recámaras y alberca"
- "Departamento para rentar en Roma Norte menos de 20 mil"
- "House with garden in Coyoacán under 5 million"
- "2 bedroom apartment near metro stations"

## How It Works

1. User enters a natural language query
2. The system sends the query to Claude AI
3. AI extracts structured filters:
   - Location (city, neighborhood)
   - Price range
   - Property type
   - Transaction type (rent/sale)
   - Bedrooms/bathrooms
   - Features (pool, garden, parking)
4. These filters are applied to search the property database

## Fallback Behavior

If no API key is configured or if the AI service is unavailable, the system falls back to keyword-based search using regular expressions.

## Testing

1. Start the web app: `cd apps/web && npm run dev`
2. Navigate to http://localhost:3000
3. Use the search bar with natural language queries
4. The AI will parse your query and show relevant results

## API Usage

The feature uses Anthropic's Claude API with the following defaults:
- Model: `claude-3-opus-20240229`
- Max tokens: 1024
- Temperature: 0.1 (for consistent parsing)

## Monitoring

Check the browser console for:
- "Using AI provider: claude" - Confirms AI is active
- "Falling back to keyword search" - Indicates missing API key or error