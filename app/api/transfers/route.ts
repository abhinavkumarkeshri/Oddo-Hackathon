import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const transfers = await prisma.transferRequest.findMany({
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        fromUser: { select: { id: true, name: true, email: true, departmentId: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transfers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}
