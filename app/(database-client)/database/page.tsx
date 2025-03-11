import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { DatabaseClient } from "@/components/database-client";

export default async function DatabasePage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return <DatabaseClient />;
}
