import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const assets = await prisma.asset.findMany({
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized. Insufficient permissions." }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      categoryId,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      condition,
      location,
      departmentId,
      isBookable,
      photoUrl,
      documentUrls,
    } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: "Name and Category are required" }, { status: 400 });
    }

    // Auto-generate asset tag
    const result = await prisma.$transaction(async (tx) => {
      // Find the asset with the highest tag
      const lastAsset = await tx.asset.findFirst({
        where: { assetTag: { startsWith: "AF-" } },
        orderBy: { assetTag: "desc" },
      });

      let nextNumber = 1;
      if (lastAsset && lastAsset.assetTag) {
        const parts = lastAsset.assetTag.split("-");
        if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
          nextNumber = parseInt(parts[1], 10) + 1;
        }
      }

      const newAssetTag = `AF-${String(nextNumber).padStart(4, "0")}`;
      // Use asset tag as QR Code default value
      const qrCodeValue = newAssetTag;

      return await tx.asset.create({
        data: {
          name,
          categoryId,
          assetTag: newAssetTag,
          serialNumber: serialNumber || null,
          qrCode: qrCodeValue,
          acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
          acquisitionCost: acquisitionCost ? Number(acquisitionCost) : null,
          condition: condition || "GOOD",
          location: location || null,
          departmentId: departmentId || null,
          isBookable: isBookable || false,
          photoUrl: photoUrl || null,
          documentUrls: documentUrls || [],
          status: "AVAILABLE",
        },
        include: {
          category: true,
          department: true,
        },
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "Serial number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to register asset" }, { status: 500 });
  }
}
