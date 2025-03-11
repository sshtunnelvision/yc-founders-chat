import { NextResponse } from "next/server";
import { executeFoundersQuery } from "@/lib/db/queries";
import { auth } from "@/app/(auth)/auth";

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
    const { sqlQuery } = await request.json();

    if (!sqlQuery) {
      return new NextResponse(
        JSON.stringify({ error: "SQL query is required" }),
        { status: 400 }
      );
    }

    // Validate the query to prevent harmful operations
    const lowerQuery = sqlQuery.toLowerCase();
    
    // Only allow SELECT statements
    if (!lowerQuery.trim().startsWith('select')) {
      return new NextResponse(
        JSON.stringify({ error: "Only SELECT queries are allowed" }),
        { status: 400 }
      );
    }
    
    // Prevent any data modification
    const forbiddenKeywords = ['insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate'];
    if (forbiddenKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return new NextResponse(
        JSON.stringify({ error: "Data modification queries are not allowed" }),
        { status: 400 }
      );
    }

    // Ensure the query targets the knowledge schema
    const validTables = ['knowledge.founders', 'knowledge.founder_linkedin_data'];
    const hasValidTable = validTables.some(table => lowerQuery.includes(table.toLowerCase()));
    
    if (!hasValidTable) {
      return new NextResponse(
        JSON.stringify({ error: "Query must target knowledge.founders or knowledge.founder_linkedin_data tables" }),
        { status: 400 }
      );
    }

    // Execute the query
    const results = await executeFoundersQuery(sqlQuery);

    return new NextResponse(
      JSON.stringify({ results }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error executing SQL query:", error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error 
          ? error.message 
          : "An error occurred while executing the query" 
      }),
      { status: 500 }
    );
  }
} 