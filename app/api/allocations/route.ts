import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allocations = await prisma.allocation.findMany({
      include: {
        asset: { select: { id: true, name: true, assetTag: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(allocations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch allocations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { assetId, userId, departmentId, expectedReturnDate } = body;

    if (!assetId || !userId) {
      return NextResponse.json({ error: "Asset and User are required" }, { status: 400 });
    }

    // CONFLICT RULE: Check if asset already has an ACTIVE allocation
    const existingAllocation = await prisma.allocation.findFirst({
      where: {
        assetId,
        status: "ACTIVE",
      },
      include: {
        user: { select: { name: true } }
      }
    });

    if (existingAllocation) {
      return NextResponse.json(
        { 
          error: `Currently held by ${existingAllocation.user.name}`, 
          code: "CONFLICT_ACTIVE_ALLOCATION" 
        }, 
        { status: 409 }
      );
    }

    // Ensure asset is AVAILABLE
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Asset is not available for allocation" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const allocation = await tx.allocation.create({
        data: {
          assetId,
          userId,
          departmentId: departmentId || null,
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          status: "ACTIVE",
        },
        include: {
          asset: true,
          user: true,
        },
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: "ALLOCATED" },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "ALLOCATION_CREATED",
          entityType: "Allocation",
          entityId: allocation.id,
          detailsJson: { assetId, allocatedTo: userId },
        }
      });

      return allocation;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create allocation" }, { status: 500 });
  }
}
