import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AssetsClient from "./AssetsClient";

export default async function AssetsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AssetsClient role={session.user.role as string} />;
}
