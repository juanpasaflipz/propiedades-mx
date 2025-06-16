import { NextRequest, NextResponse } from 'next/server';
import { getStructuredFilters } from '@/lib/ai-search';
import { FilterObject } from '@/types/ai-search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query. Please provide a string query.' },
        { status: 400 }
      );
    }
    
    // Limit query length to prevent abuse
    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Query too long. Maximum 500 characters allowed.' },
        { status: 400 }
      );
    }
    
    console.log('Processing natural language query:', query);
    
    // Get structured filters from AI
    const filters = await getStructuredFilters(query);
    
    console.log('Generated filters:', filters);
    
    return NextResponse.json({
      success: true,
      query,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI search error:', error);
    
    // Don't expose internal errors to client
    const message = error instanceof Error ? error.message : 'Failed to parse search query';
    
    return NextResponse.json(
      { 
        error: 'Failed to process search query',
        details: process.env.NODE_ENV === 'development' ? message : undefined
      },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}