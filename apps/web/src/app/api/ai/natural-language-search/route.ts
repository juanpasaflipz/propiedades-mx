import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { searchPropertiesFunction } from "@/lib/openai-functions";
import { Pool } from 'pg';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Call OpenAI to extract structured data from natural language
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un asistente que ayuda a buscar propiedades inmobiliarias en México. Extrae la información relevante de las consultas de búsqueda en español."
        },
        { 
          role: "user", 
          content: query 
        }
      ],
      functions: [searchPropertiesFunction],
      function_call: "auto"
    });

    const message = chatResponse.choices[0].message;
    
    if (!message.function_call) {
      return NextResponse.json(
        { error: 'Could not parse search query' },
        { status: 400 }
      );
    }

    const functionArgs = JSON.parse(message.function_call.arguments);

    // Build SQL query with proper parameterization
    let sql = `
      SELECT 
        id,
        title,
        price,
        bedrooms,
        bathrooms,
        area_size,
        location,
        neighborhood,
        property_type,
        images,
        created_at
      FROM properties 
      WHERE bedrooms >= $1 
        AND LOWER(neighborhood) LIKE LOWER($2)
        AND price <= $3
    `;

    const params: any[] = [
      functionArgs.recamaras,
      `%${functionArgs.colonia}%`,
      functionArgs.precio_max
    ];

    // Add garden filter if specified
    if (functionArgs.jardin !== undefined) {
      sql += ` AND has_garden = $4`;
      params.push(functionArgs.jardin);
    }

    sql += ` ORDER BY created_at DESC LIMIT 50`;

    // Execute query
    const results = await pool.query(sql, params);

    return NextResponse.json({
      query: query,
      filters: functionArgs,
      results: results.rows,
      count: results.rowCount
    });

  } catch (error) {
    console.error('Natural language search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}