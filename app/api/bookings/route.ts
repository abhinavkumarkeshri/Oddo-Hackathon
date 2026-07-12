import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function syncBookingStatuses() {
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  
  // UPCOMING -> ONGOING
  await prisma.booking.updateMany({
    where: { status: "UPCOMING", startTime: { lte: now }, endTime: { gt: now } },
    data: { status: "ONGOING" },
  });

  // UPCOMING or ONGOING -> COMPLETED
  await prisma.booking.updateMany({
    where: { status: { in: ["UPCOMING", "ONGOING"] }, endTime: { lte: now } },
    data: { status: "COMPLETED" },
  });

  // REMINDER NOTIFICATIONS: For UPCOMING bookings starting within 60 mins
  const upcomingBookings = await prisma.booking.findMany({
    where: { 
      status: "UPCOMING", 
      startTime: { gt: now, lte: nextHour }
    },
    include: { asset: true }
  });

  for (const booking of upcomingBookings) {
    const existingReminder = await prisma.notification.findFirst({
      where: {
        userId: booking.requestedById,
        type: "Booking Reminder",
        relatedEntityId: booking.id
      }
    });

    if (!existingReminder) {
      await prisma.notification.create({
        data: {
          userId: booking.requestedById,
          type: "Booking Reminder",
          message: `Reminder: Your booking for ${booking.asset.name} starts in less than an hour!`,
          relatedEntityType: "Booking",
          relatedEntityId: booking.id
        }
      });
    }
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await syncBookingStatuses();

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

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
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

      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: "Booking Confirmed",
          message: `Your booking for ${booking.asset.name} from ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()} is confirmed.`,
          relatedEntityType: "Booking",
          relatedEntityId: booking.id,
        }
      });

      // Also log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "BOOKING_CREATED",
          entityType: "Booking",
          entityId: booking.id,
          detailsJson: { assetId, startTime: start, endTime: end },
        }
      });

      return booking;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
