import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import { validateBody } from '../middleware/validation';
import { AISearchSchema } from '../validation/schemas';
import { getOpenAIService } from '../services/openai.service';

dotenv.config();

const router = Router();

// System prompt for Claude
const SYSTEM_PROMPT = `You are a real estate search assistant for Mexico. Extract structured data from natural language queries in Spanish or English.

Return a JSON object with these fields:
- location: string (city, neighborhood, or region)
- priceRange: { min: number, max: number } or null
- bedrooms: number or null
- bathrooms: number or null
- propertyType: "house" | "apartment" | "condo" | "commercial" | "land" | null
- transactionType: "rent" | "sale" | null
- features: string[] (amenities like pool, garden, parking)

Examples:
"Casa en Polanco con 3 recámaras" -> { location: "Polanco", bedrooms: 3, propertyType: "house" }
"Depto para rentar en Roma Norte menos de 20 mil" -> { location: "Roma Norte", transactionType: "rent", priceRange: { max: 20000 } }`;

// Call Claude API
async function callClaudeAPI(prompt: string): Promise<any> {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  return JSON.parse(data.content[0].text);
}

// Parse natural language search
router.post('/parse-search', validateBody(AISearchSchema), async (req: Request, res: Response) => {
  try {
    const { query, provider = 'auto' } = req.body; // provider can be 'openai', 'claude', or 'auto'
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter is required' 
      });
    }

    let filters;
    let method;

    // Determine which AI provider to use
    if (provider === 'openai' || (provider === 'auto' && process.env.OPENAI_API_KEY)) {
      try {
        // Use OpenAI
        const openAIService = getOpenAIService();
        filters = await openAIService.parseSearchQuery(query);
        method = 'openai';
      } catch (error) {
        console.error('OpenAI parsing failed:', error);
        // Fall back to Claude if OpenAI fails
        if (process.env.CLAUDE_API_KEY) {
          filters = await callClaudeAPI(query);
          method = 'claude_fallback';
        } else {
          filters = extractKeywords(query);
          method = 'keyword_fallback';
        }
      }
    } else if (provider === 'claude' || (provider === 'auto' && process.env.CLAUDE_API_KEY)) {
      // Use Claude API
      filters = await callClaudeAPI(query);
      method = 'claude';
    } else {
      // Fallback to basic keyword extraction
      filters = extractKeywords(query);
      method = 'keyword';
    }
    
    res.json({ 
      success: true, 
      query, 
      filters,
      method
    });
    
  } catch (error) {
    console.error('Error parsing search query:', error);
    
    // Fallback to keyword extraction on error
    const filters = extractKeywords(req.body.query);
    res.json({ 
      success: true, 
      query: req.body.query, 
      filters,
      method: 'keyword_fallback'
    });
  }
});

// Optimize search query endpoint (OpenAI only)
router.post('/optimize-query', validateBody(AISearchSchema), async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter is required' 
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }

    const openAIService = getOpenAIService();
    const optimizedQuery = await openAIService.optimizeSearchQuery(query);
    
    res.json({ 
      success: true, 
      originalQuery: query, 
      optimizedQuery
    });
    
  } catch (error) {
    console.error('Error optimizing query:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to optimize query' 
    });
  }
});

// Basic keyword extraction fallback
function extractKeywords(query: string): any {
  const normalized = query.toLowerCase();
  const filters: any = {};

  // Extract location
  const locations = ['polanco', 'condesa', 'roma norte', 'santa fe', 'coyoacán'];
  for (const loc of locations) {
    if (normalized.includes(loc)) {
      filters.location = loc;
      break;
    }
  }

  // Extract property type
  if (normalized.includes('casa')) filters.propertyType = 'house';
  else if (normalized.includes('departamento') || normalized.includes('depto')) filters.propertyType = 'apartment';
  else if (normalized.includes('terreno')) filters.propertyType = 'land';

  // Extract transaction type
  if (normalized.includes('renta') || normalized.includes('rentar')) filters.transactionType = 'rent';
  else if (normalized.includes('venta') || normalized.includes('comprar')) filters.transactionType = 'sale';

  // Extract bedrooms
  const bedroomMatch = normalized.match(/(\d+)\s*(recámaras?|habitaciones?|bedrooms?)/);
  if (bedroomMatch) filters.bedrooms = parseInt(bedroomMatch[1]);

  // Extract price
  const priceMatch = normalized.match(/(\d+[\d,]*)\s*(mil|pesos|dollars?|usd|mxn)?/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    if (normalized.includes('menos de') || normalized.includes('hasta')) {
      filters.priceRange = { max: price * (priceMatch[2] === 'mil' ? 1000 : 1) };
    }
  }

  return filters;
}

export { router as aiRoutes };