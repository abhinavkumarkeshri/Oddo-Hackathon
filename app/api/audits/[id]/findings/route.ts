import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const auditId = params.id;
    const body = await req.json();
    const { assetId, result, notes } = body;

    if (!assetId || !result) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const auditCycle = await prisma.auditCycle.findUnique({
      where: { id: auditId },
      include: { assignments: true },
    });

    if (!auditCycle) {
      return NextResponse.json({ error: "Audit cycle not found" }, { status: 404 });
    }

    if (auditCycle.status !== "OPEN") {
      return NextResponse.json({ error: "Audit cycle is closed" }, { status: 400 });
    }

    const isManager = ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);
    const isAssigned = auditCycle.assignments.some(a => a.auditorId === session.user.id);
    
    if (!isManager && !isAssigned) {
      return NextResponse.json({ error: "You are not authorized to record findings for this audit" }, { status: 403 });
    }

    // Create the finding
    const finding = await prisma.auditFinding.create({
      data: {
        auditCycleId: auditId,
        assetId,
        result,
        notes: notes || null,
      },
    });

    if (result === "MISSING" || result === "DAMAGED") {
      const asset = await prisma.asset.findUnique({ where: { id: assetId } });
      const managers = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "ASSET_MANAGER"] } }
      });
      
      if (asset && managers.length > 0) {
        const message = `Audit Discrepancy: ${asset.name} (${asset.assetTag}) was marked as ${result}.`;
        await prisma.notification.createMany({
          data: managers.map(m => ({
            userId: m.id,
            type: "Audit Discrepancy Flagged",
            message,
            relatedEntityType: "Asset",
            relatedEntityId: asset.id,
          }))
        });
      }
    }

    return NextResponse.json(finding);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to record finding" }, { status: 500 });
  }
}
