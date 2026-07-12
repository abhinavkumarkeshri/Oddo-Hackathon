import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { conditionCheckInNotes } = body;

    const allocation = await prisma.allocation.findUnique({
      where: { id: params.id },
      include: { asset: true },
    });

    if (!allocation) {
      return NextResponse.json({ error: "Allocation not found" }, { status: 404 });
    }

    if (allocation.status === "RETURNED") {
      return NextResponse.json({ error: "Allocation is already returned" }, { status: 400 });
    }

    // Only Admin, Asset Manager, or the assigned user can return
    if (!["ADMIN", "ASSET_MANAGER"].includes(session.user.role) && allocation.userId !== session.user.id) {
       return NextResponse.json({ error: "Unauthorized to return this asset" }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAllocation = await tx.allocation.update({
        where: { id: params.id },
        data: {
          status: "RETURNED",
          returnedAt: new Date(),
          conditionCheckInNotes: conditionCheckInNotes || null,
        },
      });

      await tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: "AVAILABLE" },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "ASSET_RETURNED",
          entityType: "Allocation",
          entityId: allocation.id,
        }
      });

      return updatedAllocation;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to return asset" }, { status: 500 });
  }
}
