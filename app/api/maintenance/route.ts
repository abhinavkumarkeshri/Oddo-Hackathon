import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        raisedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(maintenanceRequests);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch maintenance requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { assetId, issueDescription, priority, photoUrl } = body;

    if (!assetId || !issueDescription || !priority) {
      return NextResponse.json({ error: "Asset, issue description, and priority are required" }, { status: 400 });
    }

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        raisedById: session.user.id,
        issueDescription,
        priority,
        photoUrl: photoUrl || null,
        status: "PENDING",
      },
      include: {
        asset: true,
      }
    });

    return NextResponse.json(maintenanceRequest);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to raise maintenance request" }, { status: 500 });
  }
}
