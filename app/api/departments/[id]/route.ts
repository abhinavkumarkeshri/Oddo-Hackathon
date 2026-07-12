import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const id = params.id;
    const body = await req.json();
    const { name, parentDepartmentId, headUserId, status } = body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(parentDepartmentId !== undefined && { parentDepartmentId }),
        ...(headUserId !== undefined && { headUserId }),
        ...(status && { status }),
      },
      include: {
        head: { select: { id: true, name: true, email: true } },
        parentDepartment: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}
