import { tool, type DataStreamWriter } from 'ai';
import { z } from 'zod';
import { executeFoundersQuery } from '@/lib/db/queries';

// Rich essay-format prompt for YC founders queries
const foundersQueryPrompt = `
You are a knowledgeable assistant for Y Combinator founders and startups. When presenting information about founders:

1. Structure your response in a well-organized essay format
2. Begin with a concise overview of the query results
3. Provide rich context about the founders, their companies, and their impact
4. Include relevant information about:
   - The founder's background and expertise
   - The company's mission and vision
   - The YC batch context and timing
   - Notable achievements or milestones
   - Industry relevance and market positioning
5. Conclude with insightful observations about patterns or trends when applicable

Always maintain a professional, informative tone while making the information engaging and valuable.

##TECHNICAL REQUIREMENTS:
- Use valid PostgreSQL syntax
- Always use 'knowledge.founders' as the main table name
- For LinkedIn data, use 'knowledge.founder_linkedin_data' table which is related to 'knowledge.founders' via the founder_id field
- Keep queries focused and efficient

COLUMNS IN THE FOUNDERS TABLE:
- id
- session_id
- page_id
- name
- title
- company
- batch
- company_url
- description
- image_url
- linkedin_url

COLUMNS IN THE FOUNDER_LINKEDIN_DATA TABLE:
- id
- founder_id (foreign key to knowledge.founders.id)
- headline
- location
- experience
- education
- skills

EXAMPLE JOIN QUERY:
SELECT f.*, l.headline, l.location, l.experience, l.education, l.skills 
FROM knowledge.founders f
LEFT JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id
WHERE f.name LIKE '%John%'
`;

export interface QueryFoundersCallbackProps {
  question: string;
  dataStream: DataStreamWriter;
}

export const queryFounders = ({ dataStream }: { dataStream: DataStreamWriter }) =>
  tool({
    description: 'Query the YC Founders database to answer questions about founders, companies, and batches',
    parameters: z.object({
      question: z.string().describe('The question about YC founders to answer'),
      sqlQuery: z.string().describe('The SQL query to execute against the founders table'),
    }),
    execute: async ({ question, sqlQuery }) => {
      try {
        // Send querying status immediately
        dataStream.writeData({
          type: 'step-update',
          content: {
            step: 'querying',
            message: 'Querying database...'
          },
        });

        // Add a small delay to ensure UI updates are visible
        await new Promise(resolve => setTimeout(resolve, 500));

        // Execute the query
        const results = await executeFoundersQuery(sqlQuery);

        // Convert results to a serializable format
        const serializableResults = JSON.parse(JSON.stringify(results));

        // Generate a more descriptive summary of the results
        let resultSummary = '';
        if (Array.isArray(serializableResults)) {
          resultSummary = `Found ${serializableResults.length} results related to your query about ${question.toLowerCase()}.`;
        }

        // Add a small delay before showing results
        await new Promise(resolve => setTimeout(resolve, 500));

        // Send the results count to the UI
        dataStream.writeData({
          type: 'step-update',
          content: {
            step: 'results',
            message: resultSummary
          },
        });

        // Return results with the prompt for rich essay formatting
        return {
          question,
          sqlQuery,
          results: serializableResults,
          summary: resultSummary,
          isDirectResponse: true,
          formatInstructions: foundersQueryPrompt
        };
      } catch (error) {
        console.error('Error executing founders query:', error);
        
        dataStream.writeData({
          type: 'step-update',
          content: {
            step: 'error',
            message: error instanceof Error ? error.message : String(error)
          },
        });
        
        throw error;
      }
    },
  }); 