"use client";

import type { Attachment, Message, ChatRequestOptions } from "ai";
import { useChat } from "ai/react";
import { useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { cx } from "class-variance-authority";

import { ChatHeader } from "@/components/chat-header";
import type { Vote } from "@/lib/db/schema";
import { fetcher, generateUUID } from "@/lib/utils";

import { Artifact } from "./artifact";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { toast } from "sonner";

const getErrorMessage = (error: any) => {
  // Check for max tokens error in various formats
  const maxTokensErrorMessages = [
    "maximum context length",
    "context_length_exceeded",
    "maximum token limit",
    "token limit exceeded",
  ];

  // Function to check if any of the error messages are included in a string
  const containsMaxTokensError = (str: string) => {
    if (!str) return false;
    return maxTokensErrorMessages.some((msg) =>
      str.toLowerCase().includes(msg.toLowerCase())
    );
  };

  // Check if error is a simple Error object with the generic message
  if (error instanceof Error && error.message === "Oops, an error occured!") {
    return {
      title: "Maximum token limit exceeded",
      description:
        "That was too many tokens for the context limit. We are in beta mode. For queries with larger responses please query the database directly on the database page.",
    };
  }

  // Check error.message (direct property)
  if (error?.message && containsMaxTokensError(error.message)) {
    return {
      title: "Maximum token limit exceeded",
      description:
        "That was too many tokens for the context limit. We are in beta mode. For queries with larger responses please query the database directly on the database page.",
    };
  }

  // Check error.responseBody (as string)
  if (error?.responseBody && typeof error.responseBody === "string") {
    // Try to parse responseBody as JSON
    try {
      const parsedBody = JSON.parse(error.responseBody);

      // Check for context length exceeded error in parsed JSON
      if (
        (parsedBody?.error?.message &&
          containsMaxTokensError(parsedBody.error.message)) ||
        parsedBody?.error?.code === "context_length_exceeded"
      ) {
        return {
          title: "Maximum token limit exceeded",
          description:
            "That was too many tokens for the context limit. We are in beta mode. For queries with larger responses please query the database directly on the database page.",
        };
      }

      // Check for string too long error
      if (parsedBody?.error?.message?.includes("string too long")) {
        return {
          title: "Message too long",
          description:
            "Please try breaking your request into smaller chunks or removing some of the context.",
        };
      }
    } catch (e) {
      // Parse error, fall through to default
    }
  }

  // Default error message
  return {
    title: "An error occurred",
    description: "Please try again",
  };
};

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
}) {
  const { mutate } = useSWRConfig();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate("/api/history");
    },
    onError: (error) => {
      const { title, description } = getErrorMessage(error);
      toast.error(title, {
        description: description,
        duration: 5000,
      });
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  return (
    <>
      <div
        className={cx(
          "flex h-dvh flex-col",
          isArtifactVisible ? "overflow-x-hidden" : "overflow-hidden"
        )}
      >
        <ChatHeader title="Chat" />

        <Messages
          chatId={id}
          isLoading={isLoading}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          votes={votes}
          isReadonly={false}
          isArtifactVisible={isArtifactVisible}
        />

        <div className="flex flex-col mx-auto px-6 md:px-8 pb-6 md:pb-8 w-full max-w-3xl">
          <form className="flex w-full gap-2" onSubmit={(e) => handleSubmit(e)}>
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Not affiliated with Y Combinator or any of its subsidiaries. LLMs
            can hallucinate and generate false information.
            <br />
            Made with love by{" "}
            <a
              href="https://x.com/sshtunnelvision"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500"
            >
              @sshtunnelvision
            </a>
            . This is an{" "}
            <a
              href="https://elucide.chat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500"
            >
              elucide product
            </a>
            .
          </p>
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={false}
      />
    </>
  );
}
