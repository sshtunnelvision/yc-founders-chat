import { auth } from "@/app/(auth)/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SidebarProvider>
      <div className="flex h-[100svh] w-full">
        <AppSidebar user={session?.user} />
        <main className="flex flex-col flex-1 h-full w-full overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
