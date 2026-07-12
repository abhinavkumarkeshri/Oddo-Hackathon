import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bookings = await prisma.booking.findMany({
      include: {
        asset: { select: { id: true, name: true, assetTag: true, isBookable: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { assetId, startTime, endTime, onBehalfOfDept } = body;

    if (!assetId || !startTime || !endTime) {
      return NextResponse.json({ error: "Asset, start time, and end time are required" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
       return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || !asset.isBookable) {
      return NextResponse.json({ error: "Asset is not bookable" }, { status: 400 });
    }

    // Determine departmentId
    let departmentId = null;
    if (onBehalfOfDept) {
      if (session.user.role !== "DEPT_HEAD") {
        return NextResponse.json({ error: "Only Department Heads can book on behalf of a department" }, { status: 403 });
      }
      departmentId = session.user.departmentId;
    }

    // OVERLAP RULE: reject if [startTime, endTime) overlaps any existing UPCOMING/ONGOING booking
    // Overlap = newStart < existingEnd AND newEnd > existingStart
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        assetId,
        status: { in: ["UPCOMING", "ONGOING"] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlappingBooking) {
      return NextResponse.json({ error: "Time slot overlaps with an existing booking" }, { status: 409 });
    }

    const booking = await prisma.booking.create({
      data: {
        assetId,
        requestedById: session.user.id,
        departmentId,
        startTime: start,
        endTime: end,
        status: "UPCOMING",
      },
      include: {
        asset: true,
        requestedBy: true,
      }
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
