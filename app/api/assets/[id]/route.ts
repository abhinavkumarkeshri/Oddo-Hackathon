import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = params.id;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        allocations: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { allocatedAt: "desc" },
        },
        maintenanceRequests: {
          include: {
            raisedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch asset details" }, { status: 500 });
  }
}
