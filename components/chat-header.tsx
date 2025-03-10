"use client";

import { useRouter } from "next/navigation";
import { type ComponentProps } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { PlusIcon } from "./icons";
import { cn } from "@/lib/utils";

export function ChatHeader({ className, ...props }: ComponentProps<"header">) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-12 w-full shrink-0 items-center justify-between px-4 bg-transparent",
        className
      )}
      {...props}
    >
      <div className="font-light text-sm tracking-wide">
        elucide v1 - yc founder&apos;s chat
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
          className="h-8 gap-2"
        >
          <PlusIcon />
          <span className="font-light">New Chat</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => signOut({ redirectTo: "/" })}
          className="h-8 gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-light">Logout</span>
        </Button>
      </div>
    </header>
  );
}
