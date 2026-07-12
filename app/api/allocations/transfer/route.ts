import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { assetId } = body;

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    // Find the current active allocation for this asset
    const activeAllocation = await prisma.allocation.findFirst({
      where: {
        assetId,
        status: "ACTIVE",
      },
    });

    if (!activeAllocation) {
      return NextResponse.json({ error: "Asset does not have an active allocation to transfer" }, { status: 400 });
    }

    if (activeAllocation.userId === session.user.id) {
       return NextResponse.json({ error: "You cannot transfer an asset to yourself" }, { status: 400 });
    }

    const transferRequest = await prisma.transferRequest.create({
      data: {
        assetId,
        fromUserId: activeAllocation.userId,
        toUserId: session.user.id,
        status: "REQUESTED",
      },
    });

    return NextResponse.json(transferRequest);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to request transfer" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { transferRequestId, action } = body; // action: "APPROVE" or "REJECT"

    if (!transferRequestId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const transferRequest = await prisma.transferRequest.findUnique({
      where: { id: transferRequestId },
      include: { asset: true, fromUser: true, toUser: true },
    });

    if (!transferRequest || transferRequest.status !== "REQUESTED") {
      return NextResponse.json({ error: "Transfer request not found or already processed" }, { status: 404 });
    }

    // Check permissions: Asset Manager or relevant Department Head (of the fromUser's dept)
    const isAssetManager = ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);
    const isDeptHead = session.user.role === "DEPT_HEAD" && session.user.departmentId === transferRequest.fromUser.departmentId;
    
    // Allow the current owner (fromUser) to approve as well? The prompt says: "Asset Manager or the relevant Department Head only".
    if (!isAssetManager && !isDeptHead) {
      return NextResponse.json({ error: "Unauthorized to process transfer" }, { status: 403 });
    }

    if (action === "REJECT") {
      const rejected = await prisma.transferRequest.update({
        where: { id: transferRequestId },
        data: { status: "REJECTED" },
      });

      await prisma.notification.create({
        data: {
          userId: transferRequest.toUserId,
          type: "TRANSFER_REJECTED",
          message: `Your transfer request for ${transferRequest.asset.name} was rejected.`,
          relatedEntityType: "TransferRequest",
          relatedEntityId: transferRequest.id,
        }
      });

      return NextResponse.json(rejected);
    }

    if (action === "APPROVE") {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Approve Transfer Request
        const approved = await tx.transferRequest.update({
          where: { id: transferRequestId },
          data: { 
            status: "APPROVED",
            approvedById: session.user.id,
          },
        });

        // 2. Set old allocation to RETURNED
        await tx.allocation.updateMany({
          where: { 
            assetId: transferRequest.assetId,
            userId: transferRequest.fromUserId,
            status: "ACTIVE",
          },
          data: {
            status: "RETURNED",
            returnedAt: new Date(),
          },
        });

        // 3. Create new allocation
        const newAllocation = await tx.allocation.create({
          data: {
            assetId: transferRequest.assetId,
            userId: transferRequest.toUserId,
            departmentId: transferRequest.toUser.departmentId,
            status: "ACTIVE",
          }
        });

        // 4. Activity Log
        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: "TRANSFER_APPROVED",
            entityType: "TransferRequest",
            entityId: transferRequest.id,
            detailsJson: { from: transferRequest.fromUserId, to: transferRequest.toUserId },
          }
        });

        // 5. Notifications
        await tx.notification.createMany({
          data: [
            {
              userId: transferRequest.toUserId,
              type: "TRANSFER_APPROVED",
              message: `Your transfer request for ${transferRequest.asset.name} was approved. You are now the owner.`,
              relatedEntityType: "Allocation",
              relatedEntityId: newAllocation.id,
            },
            {
              userId: transferRequest.fromUserId,
              type: "ASSET_TRANSFERRED",
              message: `${transferRequest.asset.name} has been transferred from you to ${transferRequest.toUser.name}.`,
              relatedEntityType: "Asset",
              relatedEntityId: transferRequest.assetId,
            }
          ]
        });

        return approved;
      });

      return NextResponse.json(result);
    }

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process transfer request" }, { status: 500 });
  }
}
