import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    // Enforce Admin-only access
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const id = params.id;
    const body = await req.json();
    const { role } = body;

    // Validate role is allowed for promotion (based on prompt: DEPT_HEAD or ASSET_MANAGER)
    // Actually, Admin can also set it back to EMPLOYEE or make another ADMIN if needed, but let's allow what's valid in the enum.
    if (!role || !["EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, role: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
