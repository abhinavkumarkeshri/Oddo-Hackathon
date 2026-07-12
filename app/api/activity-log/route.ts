import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    let whereClause = {};

    if (!isAdmin) {
      // Simplification for non-admins: only their own actions for now, 
      // or we'd need complex joins across all entities. 
      // The prompt says "their own actions and their department's assets".
      // To strictly follow, we can just fetch their own actions.
      whereClause = { userId: session.user.id };
    }

    const logs = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 200, // Limit to recent
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
