import { auth } from "@/app/(auth)/auth";
import { ChatHeader } from "@/components/chat-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DatabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full">
        <AppSidebar user={session?.user} />
        <div className="flex flex-col flex-1 size-full overflow-hidden">
          <ChatHeader />
          <main className="flex-1 overflow-auto p-6 md:px-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
