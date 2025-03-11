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

Table name: knowledge.founder_linkedin_data
Columns:
- id (UUID): Unique identifier for each record
- founder_id (UUID): Foreign key referencing knowledge.founders.id
- headline (text): LinkedIn headline
- location (text): LinkedIn location
- experience (json): LinkedIn experience data as JSON array
- education (json): LinkedIn education data as JSON array
- skills (json): LinkedIn skills data as JSON array

JSON STRUCTURE EXAMPLES:
1. Education JSON structure:
[
  {
    "degree": "Bachelor of Science",
    "description": "",
    "school_name": "Stanford University",
    "field_of_study": "Computer Science"
  },
  {
    "degree": "Master of Business Administration",
    "description": "",
    "school_name": "Harvard Business School",
    "field_of_study": "Business"
  }
]

2. Experience JSON structure:
[
  {
    "title": "CEO",
    "company_name": "Example Corp",
    "description": "Led company growth",
    "location": "San Francisco"
  }
]

IMPORTANT RULES:
1. Always use 'knowledge.founders' as the main table name and 'knowledge.founder_linkedin_data' for LinkedIn data
2. Generate only valid PostgreSQL syntax
3. Return ONLY the SQL query without any explanations or markdown formatting
4. Keep queries focused and efficient
5. Use appropriate WHERE clauses to filter results
6. Use LIMIT when appropriate to avoid excessive results
7. Use ILIKE for case-insensitive text matching
8. For fuzzy text matching, use ILIKE with % wildcards
9. When joining tables, use table aliases (e.g., 'f' for founders, 'l' for LinkedIn data)
10. To join the tables: FROM knowledge.founders f LEFT JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id

QUERYING JSON FIELDS:
1. To search within JSON arrays (education, experience, skills), use jsonb_array_elements:
   - For education: SELECT 1 FROM jsonb_array_elements(l.education::jsonb) edu WHERE edu->>'school_name' ILIKE '%Stanford%'
   - For experience: SELECT 1 FROM jsonb_array_elements(l.experience::jsonb) exp WHERE exp->>'company_name' ILIKE '%Google%'

EXAMPLE QUERIES:
1. Find founders who went to Stanford:
   SELECT f.name, f.company, f.batch 
   FROM knowledge.founders f 
   JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id 
   WHERE EXISTS (
     SELECT 1 FROM jsonb_array_elements(l.education::jsonb) edu
     WHERE edu->>'school_name' ILIKE '%Stanford%'
   )
   LIMIT 100;

2. Find founders who worked at Google:
   SELECT f.name, f.company, f.batch 
   FROM knowledge.founders f 
   JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id 
   WHERE EXISTS (
     SELECT 1 FROM jsonb_array_elements(l.experience::jsonb) exp
     WHERE exp->>'company_name' ILIKE '%Google%'
   )
   LIMIT 50;

3. Count founders by university:
   SELECT edu->>'school_name' as university, COUNT(DISTINCT f.id) as founder_count
   FROM knowledge.founders f 
   JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id,
   jsonb_array_elements(l.education::jsonb) edu
   WHERE edu->>'school_name' IS NOT NULL
   GROUP BY university
   ORDER BY founder_count DESC
   LIMIT 20;
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