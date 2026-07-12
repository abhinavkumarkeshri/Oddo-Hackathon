import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, technicianName } = body; // action: "APPROVE", "REJECT", "ASSIGN", "START", "RESOLVE"

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: params.id },
      include: { asset: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Maintenance request not found" }, { status: 404 });
    }

    const isAssetManager = ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);

    if (!isAssetManager) {
       return NextResponse.json({ error: "Unauthorized to process maintenance requests" }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let updatedRequest;

      switch (action) {
        case "APPROVE":
          updatedRequest = await tx.maintenanceRequest.update({
            where: { id: params.id },
            data: { status: "APPROVED", approvedById: session.user.id },
          });
          
          await tx.asset.update({
            where: { id: request.assetId },
            data: { status: "UNDER_MAINTENANCE" },
          });

          await tx.notification.create({
            data: {
              userId: request.raisedById,
              type: "MAINTENANCE_APPROVED",
              message: `Your maintenance request for ${request.asset.name} has been approved.`,
              relatedEntityType: "MaintenanceRequest",
              relatedEntityId: request.id,
            }
          });
          break;

        case "REJECT":
          updatedRequest = await tx.maintenanceRequest.update({
            where: { id: params.id },
            data: { status: "REJECTED" },
          });

          await tx.notification.create({
            data: {
              userId: request.raisedById,
              type: "MAINTENANCE_REJECTED",
              message: `Your maintenance request for ${request.asset.name} was rejected.`,
              relatedEntityType: "MaintenanceRequest",
              relatedEntityId: request.id,
            }
          });
          break;

        case "ASSIGN":
          updatedRequest = await tx.maintenanceRequest.update({
            where: { id: params.id },
            data: { status: "TECH_ASSIGNED", technicianName: technicianName || null },
          });
          break;

        case "START":
          updatedRequest = await tx.maintenanceRequest.update({
            where: { id: params.id },
            data: { status: "IN_PROGRESS" },
          });
          break;

        case "RESOLVE":
          updatedRequest = await tx.maintenanceRequest.update({
            where: { id: params.id },
            data: { status: "RESOLVED", resolvedAt: new Date() },
          });

          await tx.asset.update({
            where: { id: request.assetId },
            data: { status: "AVAILABLE" },
          });

          await tx.notification.create({
            data: {
              userId: request.raisedById,
              type: "MAINTENANCE_RESOLVED",
              message: `The maintenance for ${request.asset.name} has been resolved.`,
              relatedEntityType: "MaintenanceRequest",
              relatedEntityId: request.id,
            }
          });
          break;

        default:
          throw new Error("Invalid action");
      }

      return updatedRequest;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to update maintenance request" }, { status: 500 });
  }
}
