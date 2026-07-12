import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const audits = await prisma.auditCycle.findMany({
      include: {
        scopeDepartment: { select: { name: true } },
        _count: {
          select: { assignments: true, findings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, scopeDepartmentId, scopeLocation, startDate, endDate, auditorIds } = body;

    if (!name || (!scopeDepartmentId && !scopeLocation) || !startDate || !endDate || !auditorIds?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const auditCycle = await prisma.auditCycle.create({
      data: {
        name,
        scopeDepartmentId: scopeDepartmentId || null,
        scopeLocation: scopeLocation || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdById: session.user.id,
        status: "OPEN",
        assignments: {
          create: auditorIds.map((id: string) => ({ auditorId: id })),
        },
      },
    });

    return NextResponse.json(auditCycle);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create audit cycle" }, { status: 500 });
  }
}
