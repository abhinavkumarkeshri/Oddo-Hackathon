import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const auditId = params.id;
    const body = await req.json();
    const { autoRaiseMaintenance } = body;

    const auditCycle = await prisma.auditCycle.findUnique({
      where: { id: auditId },
      include: { findings: true },
    });

    if (!auditCycle) {
      return NextResponse.json({ error: "Audit cycle not found" }, { status: 404 });
    }

    if (auditCycle.status === "CLOSED") {
      return NextResponse.json({ error: "Audit cycle is already closed" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Lock the cycle
      await tx.auditCycle.update({
        where: { id: auditId },
        data: { status: "CLOSED" },
      });

      // Process findings
      for (const finding of auditCycle.findings) {
        if (finding.result === "MISSING") {
          await tx.asset.update({
            where: { id: finding.assetId },
            data: { status: "LOST" },
          });
        } else if (finding.result === "DAMAGED") {
          await tx.asset.update({
            where: { id: finding.assetId },
            data: { condition: "DAMAGED" },
          });
          
          if (autoRaiseMaintenance) {
            await tx.maintenanceRequest.create({
              data: {
                assetId: finding.assetId,
                raisedById: session.user!.id,
                issueDescription: `Auto-raised from Audit Cycle (Damaged): ${finding.notes || "No notes provided"}`,
                priority: "HIGH",
                status: "PENDING",
              }
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to close audit cycle" }, { status: 500 });
  }
}
