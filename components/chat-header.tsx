"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { Database, Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSidebar } from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function ChatHeader({ className, ...props }: ComponentProps<"header">) {
  const router = useRouter();
  const { toggleSidebar, isMobile, setOpenMobile, state } = useSidebar();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between px-6 md:px-8 bg-transparent",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {isMobile ? (
          /* Mobile sidebar toggle */
          <Button
            variant="ghost"
            type="button"
            className="p-2 h-fit"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="size-4" />
          </Button>
        ) : (
          /* Desktop sidebar toggle */
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                type="button"
                className="p-2 h-fit"
                onClick={toggleSidebar}
              >
                {state === "collapsed" ? (
                  <PanelLeft className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {state === "collapsed" ? "Expand Sidebar" : "Collapse Sidebar"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild className="h-8 gap-2">
          <Link href="/database">
            <Database className="size-4" />
            <span className="font-light">Database</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
