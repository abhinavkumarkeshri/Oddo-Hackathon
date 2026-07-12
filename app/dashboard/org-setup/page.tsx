import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import OrgSetupClient from "./OrgSetupClient";

export default async function OrgSetupPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <OrgSetupClient />;
}
