"use client";

import { toast } from "sonner";
import { Button } from "./ui/button";
import { CopyIcon } from "./icons";

interface CodeBlockProps {
  node: any;
  inline: boolean;
  className: string;
  children: any;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  // Extract language from className (format is like "language-javascript")
  const language = className?.split("-")[1] || "text";

  const copyToClipboard = () => {
    const code = String(children).replace(/\n$/, "");
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  if (!inline) {
    return (
      <div className="not-prose flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-t border-x border-zinc-200 dark:border-zinc-700 rounded-t-xl">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {language}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            onClick={copyToClipboard}
          >
            <CopyIcon size={12} />
          </Button>
        </div>
        <pre
          {...props}
          className="text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-b-xl dark:text-zinc-50 text-zinc-900 m-0"
        >
          <code className="whitespace-pre-wrap break-words">{children}</code>
        </pre>
      </div>
    );
  } else {
    return (
      <code
        className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
        {...props}
      >
        {children}
      </code>
    );
  }
}
