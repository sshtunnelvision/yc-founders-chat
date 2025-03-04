import { generateUUID } from '@/lib/utils';
import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';

interface CreateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      try {
        const id = generateUUID();

        dataStream.writeData({
          type: 'kind',
          content: kind,
        });

        dataStream.writeData({
          type: 'id',
          content: id,
        });

        dataStream.writeData({
          type: 'title',
          content: title,
        });

        dataStream.writeData({
          type: 'clear',
          content: '',
        });

        const documentHandler = documentHandlersByArtifactKind.find(
          (documentHandlerByArtifactKind) =>
            documentHandlerByArtifactKind.kind === kind,
        );

        if (!documentHandler) {
          dataStream.writeData({
            type: 'error',
            content: `No document handler found for kind: ${kind}`,
          });
          throw new Error(`No document handler found for kind: ${kind}`);
        }

        await documentHandler.onCreateDocument({
          id,
          title,
          dataStream,
          session,
        }).catch((error: Error) => {
          dataStream.writeData({
            type: 'error',
            content: error.message || 'Failed to create document',
          });
          throw error;
        });

        dataStream.writeData({ type: 'finish', content: '' });

        return {
          id,
          title,
          kind,
          content: 'A document was created and is now visible to the user.',
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create document';
        dataStream.writeData({
          type: 'error',
          content: errorMessage,
        });
        throw error;
      }
    },
  });
