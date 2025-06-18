import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { container } from '../../container';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Define the function schema for property search
const searchPropertiesFunction = {
  name: 'search_properties',
  description: 'Extract property search criteria from natural language queries in Spanish or English',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city, neighborhood, or area to search in (e.g., Polanco, Condesa, Santa Fe)',
      },
      propertyType: {
        type: 'string',
        enum: ['house', 'apartment', 'condo', 'land', 'office', 'commercial'],
        description: 'Type of property',
      },
      transactionType: {
        type: 'string',
        enum: ['sale', 'rent'],
        description: 'Whether to buy or rent',
      },
      bedrooms: {
        type: 'integer',
        description: 'Minimum number of bedrooms',
      },
      bathrooms: {
        type: 'integer',
        description: 'Minimum number of bathrooms',
      },
      minPrice: {
        type: 'number',
        description: 'Minimum price in Mexican pesos',
      },
      maxPrice: {
        type: 'number',
        description: 'Maximum price in Mexican pesos',
      },
      features: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'garden', 'pool', 'parking', 'pet-friendly', 'natural light',
            'balcony', 'terrace', 'gym', 'security', 'furnished',
            'view', 'roof garden', 'home office'
          ],
        },
        description: 'Special features or amenities',
      },
    },
    required: [],
  },
};

router.post('/api/ai/parse-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Skip if no OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key configured, returning mock response');
      
      // Simple keyword-based parsing as fallback
      const lowerQuery = query.toLowerCase();
      const filters: any = {};
      
      // Extract location (capitalize first letter)
      const locations = ['polanco', 'condesa', 'roma', 'santa fe', 'coyoacán', 'del valle'];
      for (const loc of locations) {
        if (lowerQuery.includes(loc)) {
          filters.location = loc.charAt(0).toUpperCase() + loc.slice(1);
          break;
        }
      }
      
      // Extract property type
      if (lowerQuery.includes('casa')) filters.propertyType = 'house';
      else if (lowerQuery.includes('depa') || lowerQuery.includes('departamento')) filters.propertyType = 'apartment';
      else if (lowerQuery.includes('terreno')) filters.propertyType = 'land';
      else if (lowerQuery.includes('oficina')) filters.propertyType = 'office';
      
      // Extract bedrooms
      const bedroomMatch = lowerQuery.match(/(\d+)\s*(recámaras?|habitaciones?|cuartos?)/);
      if (bedroomMatch) {
        filters.bedrooms = parseInt(bedroomMatch[1]);
      }
      
      // Extract price
      const priceMatch = lowerQuery.match(/(\d+[\d,]*)\s*(mil|millones?)?/);
      if (priceMatch) {
        let price = parseInt(priceMatch[1].replace(/,/g, ''));
        if (priceMatch[2] === 'mil') price *= 1000;
        else if (priceMatch[2]?.startsWith('millon')) price *= 1000000;
        
        if (lowerQuery.includes('hasta') || lowerQuery.includes('máximo')) {
          filters.priceRange = { min: 0, max: price };
        } else {
          filters.priceRange = { min: 0, max: price * 1.5 };
        }
      }
      
      // Transaction type
      if (lowerQuery.includes('renta') || lowerQuery.includes('alquiler')) {
        filters.transactionType = 'rent';
      } else {
        filters.transactionType = 'sale';
      }
      
      // Features
      filters.features = [];
      if (lowerQuery.includes('jardín') || lowerQuery.includes('jardin')) filters.features.push('garden');
      if (lowerQuery.includes('alberca') || lowerQuery.includes('piscina')) filters.features.push('pool');
      if (lowerQuery.includes('estacionamiento') || lowerQuery.includes('parking')) filters.features.push('parking');
      if (lowerQuery.includes('mascotas') || lowerQuery.includes('pet')) filters.features.push('pet-friendly');
      
      return res.json({ filters });
    }

    // Use GPT-4 to parse the natural language query
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a real estate search assistant for Mexico. Parse natural language queries in Spanish or English to extract property search criteria. 
          
          Important guidelines:
          - Extract location names and capitalize them properly (e.g., "polanco" → "Polanco", "santa fe" → "Santa Fe")
          - Recognize Mexican neighborhoods and cities
          - Parse price ranges considering Mexican peso amounts
          - Identify property types and features mentioned
          - Default to "sale" for transaction type unless rent is explicitly mentioned
          - Be flexible with Spanish property terms (e.g., "depa" = apartment, "casa" = house, "recámaras" = bedrooms)`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      functions: [searchPropertiesFunction],
      function_call: { name: 'search_properties' },
      temperature: 0.1,
    });

    const functionCall = completion.choices[0].message.function_call;
    if (!functionCall || !functionCall.arguments) {
      throw new Error('Failed to parse query');
    }

    const parsedArgs = JSON.parse(functionCall.arguments);

    // Transform the parsed arguments to match FilterObject interface
    const filters: any = {
      location: parsedArgs.location,
      propertyType: parsedArgs.propertyType,
      transactionType: parsedArgs.transactionType,
      bedrooms: parsedArgs.bedrooms,
      bathrooms: parsedArgs.bathrooms,
      priceRange: (parsedArgs.minPrice || parsedArgs.maxPrice) ? {
        min: parsedArgs.minPrice || 0,
        max: parsedArgs.maxPrice || Number.MAX_SAFE_INTEGER,
      } : undefined,
      features: parsedArgs.features || [],
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    res.json({ filters });
  } catch (error) {
    console.error('Error parsing search query:', error);
    res.status(500).json({ error: 'Failed to parse search query' });
  }
});

export default router;