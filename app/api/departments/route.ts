import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const departments = await prisma.department.findMany({
      include: {
        head: {
          select: { id: true, name: true, email: true },
        },
        parentDepartment: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, parentDepartmentId, headUserId, status } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name,
        parentDepartmentId: parentDepartmentId || null,
        headUserId: headUserId || null,
        status: status || "ACTIVE",
      },
      include: {
        head: { select: { id: true, name: true, email: true } },
        parentDepartment: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
