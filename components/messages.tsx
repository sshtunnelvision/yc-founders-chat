import type { ChatRequestOptions, Message } from "ai";
import { PreviewMessage, ThinkingMessage } from "./message";
import { useScrollToBottom } from "./use-scroll-to-bottom";
import { Overview } from "./overview";
import { memo } from "react";
import type { Vote } from "@/lib/db/schema";
import equal from "fast-deep-equal";

interface MessagesProps {
  chatId: string;
  isLoading: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[])
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

function PureMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col w-full min-w-0 gap-8 flex-1 overflow-y-scroll pt-6"
    >
      <div className="flex flex-col w-full max-w-3xl mx-auto px-6 md:px-8 space-y-8">
        {messages.length === 0 && <Overview />}

        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={isLoading && messages.length - 1 === index}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
          />
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <ThinkingMessage />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.isArtifactVisible === nextProps.isArtifactVisible &&
    equal(prevProps.messages, nextProps.messages) &&
    equal(prevProps.votes, nextProps.votes)
  );
});
