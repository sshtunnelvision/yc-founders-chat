"use client";

import { useChat } from "ai/react";
import { useEffect, useRef } from "react";
import { artifactDefinitions, type ArtifactKind } from "./artifact";
import type { Suggestion } from "@/lib/db/schema";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { toast } from "sonner";

export type DataStreamDelta = {
  type:
    | "text-delta"
    | "code-delta"
    | "sheet-delta"
    | "image-delta"
    | "title"
    | "id"
    | "suggestion"
    | "clear"
    | "finish"
    | "kind"
    | "error";
  content: string | Suggestion;
};

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      const artifactDefinition = artifactDefinitions.find(
        (artifactDefinition) => artifactDefinition.kind === artifact.kind
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: "streaming" };
        }

        switch (delta.type) {
          case "id":
            return {
              ...draftArtifact,
              documentId: delta.content as string,
              status: "streaming",
            };

          case "title":
            return {
              ...draftArtifact,
              title: delta.content as string,
              status: "streaming",
            };

          case "kind":
            return {
              ...draftArtifact,
              kind: delta.content as ArtifactKind,
              status: "streaming",
            };

          case "clear":
            return {
              ...draftArtifact,
              content: "",
              status: "streaming",
            };

          case "finish":
            return {
              ...draftArtifact,
              status: "idle",
            };

          case "error": {
            // Check for max tokens error
            const errorContent = delta.content as string;
            console.log("Data stream error content:", errorContent);

            // Direct check for the generic error message
            const isGenericError = errorContent === "Oops, an error occured!";

            // Check for specific token limit errors if not the generic error
            let isMaxTokensError = false;
            if (!isGenericError) {
              const maxTokensErrorPatterns = [
                "maximum context length",
                "context_length_exceeded",
                "maximum token limit",
                "token limit exceeded",
              ];

              isMaxTokensError = maxTokensErrorPatterns.some(
                (pattern) =>
                  errorContent &&
                  typeof errorContent === "string" &&
                  errorContent.toLowerCase().includes(pattern.toLowerCase())
              );
            }

            if (isGenericError || isMaxTokensError) {
              toast.error("Maximum token limit exceeded", {
                description:
                  "Please use the database to query for specific information about YC founders instead of asking for large amounts of data at once.",
                duration: 5000,
              });
            } else {
              toast.error(
                typeof errorContent === "string"
                  ? errorContent
                  : "An error occurred"
              );
            }
            return {
              ...draftArtifact,
              status: "idle",
            };
          }

          default:
            return draftArtifact;
        }
      });
    });
  }, [dataStream, setArtifact, setMetadata, artifact]);

  return null;
}
