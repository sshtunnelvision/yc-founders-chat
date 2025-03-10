import { auth } from "@/app/(auth)/auth";
import { ChatHeader } from "@/components/chat-header";

export default async function DatabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex flex-col h-svh">
      <ChatHeader />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
