import { tool, DataStreamWriter } from 'ai';
import { z } from 'zod';
import { executeFoundersQuery } from '@/lib/db/queries';
import { foundersQueryPrompt } from '../prompts';

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

        // Generate a simple summary of the results
        let resultSummary = '';
        if (Array.isArray(serializableResults)) {
          resultSummary = `Found ${serializableResults.length} results.`;
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

        // Return results without any introductory text
        return {
          question,
          sqlQuery,
          results: serializableResults,
          summary: resultSummary,
          isDirectResponse: true
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