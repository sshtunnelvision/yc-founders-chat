"use client";

import type { Attachment, Message, ChatRequestOptions } from "ai";
import { useChat } from "ai/react";
import { useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";

import { ChatHeader } from "@/components/chat-header";
import type { Vote } from "@/lib/db/schema";
import { fetcher, generateUUID } from "@/lib/utils";

import { Artifact } from "./artifact";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { toast } from "sonner";

// Local storage keys
const STORAGE_KEYS = {
  CHAT_INPUT: (id: string) => `yc_chat_input_${id}`,
  CHAT_ATTACHMENTS: (id: string) => `yc_chat_attachments_${id}`,
  CHAT_DRAFT_MESSAGES: (id: string) => `yc_chat_draft_messages_${id}`,
};

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
        "Please use the database to query for specific information about YC founders instead of asking for large amounts of data at once.",
    };
  }

  // Check error.message (direct property)
  if (error?.message && containsMaxTokensError(error.message)) {
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

  // Load draft messages from localStorage if available
  const loadDraftMessages = (): Array<Message> => {
    if (typeof window === "undefined") return initialMessages;

    try {
      const savedDraftMessages = localStorage.getItem(
        STORAGE_KEYS.CHAT_DRAFT_MESSAGES(id)
      );
      if (savedDraftMessages) {
        const parsedMessages = JSON.parse(savedDraftMessages);
        // Only use draft messages if they're newer than initialMessages
        // This prevents overriding server-fetched messages with older cached ones
        if (parsedMessages.length >= initialMessages.length) {
          return parsedMessages;
        }
      }
    } catch (e) {
      console.error("Error loading draft messages from localStorage:", e);
    }

    return initialMessages;
  };

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
    initialMessages: loadDraftMessages(),
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

  // Initialize attachments from localStorage if available
  const initializeAttachments = (): Array<Attachment> => {
    if (typeof window === "undefined") return [];

    try {
      const savedAttachments = localStorage.getItem(
        STORAGE_KEYS.CHAT_ATTACHMENTS(id)
      );
      if (savedAttachments) {
        return JSON.parse(savedAttachments);
      }
    } catch (e) {
      console.error("Error loading attachments from localStorage:", e);
    }

    return [];
  };

  const [attachments, setAttachments] = useState<Array<Attachment>>(
    initializeAttachments()
  );
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Load saved input from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedInput = localStorage.getItem(STORAGE_KEYS.CHAT_INPUT(id));
      if (savedInput && !input) {
        setInput(savedInput);
      }
    } catch (e) {
      console.error("Error loading input from localStorage:", e);
    }
  }, [id, input, setInput]);

  // Save input to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (input) {
        localStorage.setItem(STORAGE_KEYS.CHAT_INPUT(id), input);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CHAT_INPUT(id));
      }
    } catch (e) {
      console.error("Error saving input to localStorage:", e);
    }
  }, [id, input]);

  // Save attachments to localStorage when they change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (attachments.length > 0) {
        localStorage.setItem(
          STORAGE_KEYS.CHAT_ATTACHMENTS(id),
          JSON.stringify(attachments)
        );
      } else {
        localStorage.removeItem(STORAGE_KEYS.CHAT_ATTACHMENTS(id));
      }
    } catch (e) {
      console.error("Error saving attachments to localStorage:", e);
    }
  }, [id, attachments]);

  // Save draft messages to localStorage when they change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Only save if we have messages and they're different from initialMessages
      if (
        messages.length > 0 &&
        JSON.stringify(messages) !== JSON.stringify(initialMessages)
      ) {
        localStorage.setItem(
          STORAGE_KEYS.CHAT_DRAFT_MESSAGES(id),
          JSON.stringify(messages)
        );
      }
    } catch (e) {
      console.error("Error saving draft messages to localStorage:", e);
    }
  }, [id, messages, initialMessages]);

  // Custom submit handler that clears localStorage input after submission
  const handleSubmitWithCacheClear = (
    event?: { preventDefault?: () => void } | undefined,
    chatRequestOptions?: ChatRequestOptions | undefined
  ) => {
    handleSubmit(event, chatRequestOptions);

    // Clear input cache after successful submission
    if (typeof window !== "undefined" && !event?.preventDefault) {
      localStorage.removeItem(STORAGE_KEYS.CHAT_INPUT(id));
      localStorage.removeItem(STORAGE_KEYS.CHAT_ATTACHMENTS(id));
    }
  };

  return (
    <>
      <div className="flex flex-col min-w-0 w-full h-dvh">
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

        <div className="flex flex-col mx-auto px-6 md:px-8 pb-6 md:pb-8 w-full max-w-3xl">
          <form
            className="flex w-full gap-2"
            onSubmit={(e) => handleSubmitWithCacheClear(e)}
          >
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmitWithCacheClear}
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
        handleSubmit={handleSubmitWithCacheClear}
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
