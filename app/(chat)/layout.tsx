import { auth } from "@/app/(auth)/auth";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-[100svh]">
      <main className="flex flex-col flex-1 h-full">{children}</main>
    </div>
  );
}
