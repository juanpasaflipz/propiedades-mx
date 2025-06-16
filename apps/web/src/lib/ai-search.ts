import { FilterObject, AIProvider } from '@/types/ai-search';

// System prompt for AI to understand Mexican real estate context
const SYSTEM_PROMPT = `You are a Mexican real estate search assistant. Parse natural language queries and extract structured filters.

Rules:
1. Return ONLY valid JSON, no additional text
2. Set fields to null if not mentioned in the query
3. Translate Spanish terms to English for consistency:
   - casa/hogar → house
   - departamento/depa → apartment
   - recámara/cuarto → bedroom (count)
   - baño → bathroom (count)
   - jardín → garden
   - alberca/piscina → pool
   - estacionamiento → parking
   - mascota/perro/gato → pet-friendly
   - luz natural → natural light
   - balcón → balcony
   - terraza → terrace
   - gimnasio/gym → gym
   - seguridad → security
   - amueblado → furnished
4. For location, extract neighborhood, city, or area names
5. For price, detect currency (MXN default, USD if mentioned)
6. Property types: house, apartment, condo, land, office, commercial
7. Transaction types: sale, rent (venta → sale, renta → rent)

Return this exact JSON structure:
{
  "location": string or null,
  "priceRange": {"min": number, "max": number} or null,
  "bedrooms": number or null,
  "bathrooms": number or null,
  "features": string[] or null,
  "propertyType": string or null,
  "transactionType": "sale" | "rent" or null
}`;

/**
 * Build the prompt to send to the AI model
 */
export function buildFilterPrompt(userInput: string): string {
  return `Parse this real estate search query and return the structured JSON filter:

Query: "${userInput}"

Remember to return ONLY the JSON object with the exact structure specified.`;
}

/**
 * Get the default AI provider configuration
 */
function getDefaultProvider(): AIProvider {
  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'claude';
  
  if (provider === 'openai') {
    return {
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY || '',
      endpoint: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
    };
  }
  
  return {
    name: 'claude',
    apiKey: process.env.CLAUDE_API_KEY || '',
    endpoint: process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages',
    model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229'
  };
}

/**
 * Call Claude API
 */
async function callClaudeAPI(prompt: string, provider: AIProvider): Promise<string> {
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
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
  return data.content[0].text;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string, provider: AIProvider): Promise<string> {
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1024
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Validate price range object
 */
function validatePriceRange(priceRange: any): { min: number; max: number } | null {
  if (!priceRange || typeof priceRange !== 'object') {
    return null;
  }
  
  const min = typeof priceRange.min === 'number' ? priceRange.min : null;
  const max = typeof priceRange.max === 'number' ? priceRange.max : null;
  
  if (min === null && max === null) {
    return null;
  }
  
  return {
    min: min || 0,
    max: max || Number.MAX_SAFE_INTEGER
  };
}

/**
 * Validate property type
 */
function validatePropertyType(type: any): string | null {
  const validTypes = ['house', 'apartment', 'condo', 'land', 'office', 'commercial'];
  return typeof type === 'string' && validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : null;
}

/**
 * Validate transaction type
 */
function validateTransactionType(type: any): 'sale' | 'rent' | null {
  if (typeof type !== 'string') return null;
  const normalized = type.toLowerCase();
  if (normalized === 'sale' || normalized === 'rent') {
    return normalized;
  }
  return null;
}

/**
 * Parse and validate AI response
 */
function parseAIResponse(response: string): FilterObject {
  try {
    // Clean the response (remove markdown if present)
    const cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsed = JSON.parse(cleanResponse);
    
    // Validate the structure
    return validateFilterObject(parsed);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid JSON response from AI');
  }
}

/**
 * Validate the filter object structure
 */
function validateFilterObject(obj: any): FilterObject {
  const validated: FilterObject = {
    location: typeof obj.location === 'string' ? obj.location : null,
    priceRange: validatePriceRange(obj.priceRange),
    bedrooms: typeof obj.bedrooms === 'number' ? obj.bedrooms : null,
    bathrooms: typeof obj.bathrooms === 'number' ? obj.bathrooms : null,
    features: Array.isArray(obj.features) ? obj.features.filter(f => typeof f === 'string') : null,
    propertyType: validatePropertyType(obj.propertyType),
    transactionType: validateTransactionType(obj.transactionType)
  };
  
  return validated;
}

/**
 * Extract location from text
 */
function extractLocation(input: string): string | null {
  // Common Mexican locations
  const locations = [
    'polanco', 'condesa', 'roma norte', 'roma sur', 'coyoacán', 'del valle',
    'santa fe', 'lomas', 'satelite', 'interlomas', 'bosques',
    'guadalajara', 'monterrey', 'cancún', 'playa del carmen', 'puerto vallarta',
    'querétaro', 'puebla', 'tijuana', 'mérida', 'oaxaca'
  ];
  
  for (const location of locations) {
    if (input.includes(location)) {
      return location.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  return null;
}

/**
 * Extract price range from text
 */
function extractPriceRange(input: string): { min: number; max: number } | null {
  // Match patterns like "30 mil", "2 millones", "$50,000"
  const pricePattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(mil|millones?|k|m)?/gi;
  const matches = Array.from(input.matchAll(pricePattern));
  
  if (matches.length === 0) return null;
  
  const prices = matches.map(match => {
    let value = parseFloat(match[1].replace(/,/g, ''));
    const unit = match[2]?.toLowerCase();
    
    if (unit === 'mil' || unit === 'k') {
      value *= 1000;
    } else if (unit === 'millones' || unit === 'millon' || unit === 'm') {
      value *= 1000000;
    }
    
    return value;
  });
  
  if (prices.length === 1) {
    // Single price, determine if it's min or max based on context
    if (input.includes('máximo') || input.includes('hasta') || input.includes('menos de')) {
      return { min: 0, max: prices[0] };
    } else if (input.includes('mínimo') || input.includes('desde') || input.includes('más de')) {
      return { min: prices[0], max: Number.MAX_SAFE_INTEGER };
    }
  } else if (prices.length >= 2) {
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }
  
  return null;
}

/**
 * Extract number for bedrooms/bathrooms
 */
function extractNumber(input: string, keywords: string[]): number | null {
  for (const keyword of keywords) {
    const pattern = new RegExp(`(\\d+)\\s*${keyword}`, 'i');
    const match = input.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  return null;
}

/**
 * Extract features from text
 */
function extractFeatures(input: string): string[] | null {
  const featureMap: { [key: string]: string } = {
    'jardín': 'garden',
    'jardin': 'garden',
    'alberca': 'pool',
    'piscina': 'pool',
    'estacionamiento': 'parking',
    'cochera': 'parking',
    'garage': 'parking',
    'mascota': 'pet-friendly',
    'mascotas': 'pet-friendly',
    'perro': 'pet-friendly',
    'gato': 'pet-friendly',
    'luz natural': 'natural light',
    'iluminado': 'natural light',
    'luminoso': 'natural light',
    'balcón': 'balcony',
    'balcon': 'balcony',
    'terraza': 'terrace',
    'gimnasio': 'gym',
    'gym': 'gym',
    'seguridad': 'security',
    'vigilancia': 'security',
    'amueblado': 'furnished',
    'muebles': 'furnished',
    'vista': 'view',
    'roof garden': 'roof garden',
    'oficina': 'home office',
    'home office': 'home office'
  };
  
  const features: string[] = [];
  
  for (const [spanish, english] of Object.entries(featureMap)) {
    if (input.includes(spanish)) {
      if (!features.includes(english)) {
        features.push(english);
      }
    }
  }
  
  return features.length > 0 ? features : null;
}

/**
 * Extract property type from text
 */
function extractPropertyType(input: string): string | null {
  const typeMap: { [key: string]: string } = {
    'casa': 'house',
    'departamento': 'apartment',
    'depa': 'apartment',
    'condominio': 'condo',
    'terreno': 'land',
    'lote': 'land',
    'oficina': 'office',
    'local': 'commercial'
  };
  
  for (const [spanish, english] of Object.entries(typeMap)) {
    if (input.includes(spanish)) {
      return english;
    }
  }
  
  return null;
}

/**
 * Extract transaction type from text
 */
function extractTransactionType(input: string): 'sale' | 'rent' | null {
  if (input.includes('renta') || input.includes('rentar') || input.includes('alquiler')) {
    return 'rent';
  }
  if (input.includes('venta') || input.includes('vender') || input.includes('compra')) {
    return 'sale';
  }
  return null;
}

/**
 * Fallback filter extraction using keyword matching
 */
function getFallbackFilters(userInput: string): FilterObject {
  const input = userInput.toLowerCase();
  
  const filters: FilterObject = {
    location: extractLocation(input),
    priceRange: extractPriceRange(input),
    bedrooms: extractNumber(input, ['recámara', 'recamara', 'cuarto', 'habitación', 'habitacion', 'bedroom']),
    bathrooms: extractNumber(input, ['baño', 'bano', 'bathroom']),
    features: extractFeatures(input),
    propertyType: extractPropertyType(input),
    transactionType: extractTransactionType(input)
  };
  
  return filters;
}

/**
 * Main function to get structured filters from natural language input
 */
export async function getStructuredFilters(
  userInput: string,
  provider: AIProvider = getDefaultProvider()
): Promise<FilterObject> {
  try {
    // Check if API key is configured
    if (!provider.apiKey) {
      console.warn('AI API key not configured, using fallback filters');
      return getFallbackFilters(userInput);
    }
    
    const prompt = buildFilterPrompt(userInput);
    
    let response: string;
    
    if (provider.name === 'claude') {
      response = await callClaudeAPI(prompt, provider);
    } else {
      response = await callOpenAI(prompt, provider);
    }
    
    // Parse and validate the response
    const filters = parseAIResponse(response);
    
    return filters;
  } catch (error) {
    console.error('Error parsing natural language query:', error);
    // Fallback to basic keyword extraction
    return getFallbackFilters(userInput);
  }
}