import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    orgId?: string;
  };

  const isAdmin =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN";

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      {/* Fixed sidebar */}
      <Sidebar isAdmin={isAdmin} />

      {/* Main content area — offset by sidebar width */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: "var(--sidebar-width)" }}>
        <Topbar user={user} />

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
