"use client";

import { useRouter } from "next/navigation";
import { type ComponentProps } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Database } from "lucide-react";
import { Button } from "./ui/button";
import { PlusIcon } from "./icons";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
        YC Founder&apos;s Chat
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
        <Button variant="ghost" asChild className="h-8 gap-2">
          <Link href="/database">
            <Database className="size-4" />
            <span className="font-light">Database</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          onClick={() => signOut({ redirectTo: "/" })}
          className="h-8 gap-2"
        >
          <LogOut className="size-4" />
          <span className="font-light">Logout</span>
        </Button>
      </div>
    </header>
  );
}
