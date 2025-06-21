import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Call the backend semantic search endpoint
    const response = await fetch(`${API_URL}/api/ai/v2/semantic-search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Semantic search failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}