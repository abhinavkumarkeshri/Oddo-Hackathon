import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const auditCycle = await prisma.auditCycle.findUnique({
      where: { id: params.id },
      include: {
        scopeDepartment: true,
        assignments: {
          include: { auditor: { select: { id: true, name: true } } },
        },
        findings: {
          include: { asset: true },
          orderBy: { recordedAt: "desc" }
        },
      },
    });

    if (!auditCycle) {
      return NextResponse.json({ error: "Audit cycle not found" }, { status: 404 });
    }

    // Determine in-scope assets
    const scopeWhere: any = {};
    if (auditCycle.scopeDepartmentId) {
      scopeWhere.departmentId = auditCycle.scopeDepartmentId;
    }
    if (auditCycle.scopeLocation) {
      scopeWhere.location = auditCycle.scopeLocation;
    }
    
    // exclude RETIRED or DISPOSED assets from being audited usually, but let's just get them all if they match scope, except maybe fully removed ones.
    scopeWhere.status = { notIn: ["RETIRED", "DISPOSED"] };

    const inScopeAssets = await prisma.asset.findMany({
      where: scopeWhere,
      include: { category: true }
    });

    const findingAssetIds = new Set(auditCycle.findings.map(f => f.assetId));
    const pendingAssets = inScopeAssets.filter(a => !findingAssetIds.has(a.id));

    return NextResponse.json({
      auditCycle,
      inScopeAssets,
      pendingAssets,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch audit cycle details" }, { status: 500 });
  }
}
