"use client";

import type { Attachment, Message } from "ai";
import { useChat } from "ai/react";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { ChatHeader } from "@/components/chat-header";
import type { Vote } from "@/lib/db/schema";
import { fetcher, generateUUID } from "@/lib/utils";

import { Artifact } from "./artifact";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { VisibilityType } from "./visibility-selector";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { toast } from "sonner";

const getErrorMessage = (error: any) => {
  console.log("Error object:", error);

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
    console.log("Found generic error that might be a max tokens error");
    return {
      title: "Maximum token limit exceeded",
      description:
        "Please use the database to query for specific information about YC founders instead of asking for large amounts of data at once.",
    };
  }

  // Check error.message (direct property)
  if (error?.message && containsMaxTokensError(error.message)) {
    console.log("Found max tokens error in error.message");
    return {
      title: "Maximum token limit exceeded",
      description:
        "Please use the database to query for specific information about YC founders instead of asking for large amounts of data at once.",
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
        console.log("Found max tokens error in parsed responseBody");
        return {
          title: "Maximum token limit exceeded",
          description:
            "Please use the database to query for specific information about YC founders instead of asking for large amounts of data at once.",
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
      <div className="flex flex-col min-w-0 h-dvh">
        <ChatHeader />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={false}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
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
