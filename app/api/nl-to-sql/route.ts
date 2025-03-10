import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import OpenAIApi from "openai";

// Initialize OpenAI client
const openai = new OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt with context about the database schema
const SYSTEM_PROMPT = `
You are an expert SQL query generator for a YC Founders database. 
Your task is to convert natural language questions into valid PostgreSQL queries.

DATABASE SCHEMA:
Table name: knowledge.founders
Columns:
- id (UUID): Unique identifier for each record
- name (text): Founder's name
- title (text): Founder's title/position
- company (text): Company name
- batch (text): YC batch identifier (e.g., 'W21', 'S20')
- company_url (text): URL of the company website
- description (text): Description of the founder or company
- image_url (text): URL to founder's image
- linkedin_url (text): URL to founder's LinkedIn profile

IMPORTANT RULES:
1. Always use 'knowledge.founders' as the table name
2. Generate only valid PostgreSQL syntax
3. Return ONLY the SQL query without any explanations or markdown formatting
4. Keep queries focused and efficient
5. Use appropriate WHERE clauses to filter results
6. Use LIMIT when appropriate to avoid excessive results
7. Use ILIKE for case-insensitive text matching
8. For fuzzy text matching, use ILIKE with % wildcards
`;

export async function POST(request: Request) {
  // Check authentication
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  try {
    const { question } = await request.json();

    if (!question) {
      return new NextResponse(
        JSON.stringify({ error: "Question is required" }),
        { status: 400 }
      );
    }

    // Call OpenAI API to generate SQL query
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question }
      ],
      temperature: 0.1, // Low temperature for more deterministic outputs
      max_tokens: 500,
    });

    // Extract the generated SQL query
    const sqlQuery = response.choices[0]?.message?.content?.trim();

    if (!sqlQuery) {
      throw new Error("Failed to generate SQL query");
    }

    return new NextResponse(
      JSON.stringify({ sqlQuery }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating SQL query:", error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error 
          ? error.message 
          : "An error occurred while generating the SQL query" 
      }),
      { status: 500 }
    );
  }
} 