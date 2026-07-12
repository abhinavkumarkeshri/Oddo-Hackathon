import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, startTime, endTime } = body; // action: "CANCEL" or "RESCHEDULE"

    if (!action || !["CANCEL", "RESCHEDULE"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { asset: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!["ADMIN", "ASSET_MANAGER"].includes(session.user.role) && booking.requestedById !== session.user.id) {
       return NextResponse.json({ error: "Unauthorized to modify this booking" }, { status: 403 });
    }

    if (action === "CANCEL") {
      const result = await prisma.$transaction(async (tx) => {
        const cancelled = await tx.booking.update({
          where: { id: params.id },
          data: { status: "CANCELLED" },
        });

        await tx.notification.create({
          data: {
            userId: booking.requestedById,
            type: "BOOKING_CANCELLED",
            message: `Your booking for ${booking.asset.name} has been cancelled.`,
            relatedEntityType: "Booking",
            relatedEntityId: booking.id,
          }
        });

        return cancelled;
      });

      return NextResponse.json(result);
    }

    if (action === "RESCHEDULE") {
      if (!startTime || !endTime) {
        return NextResponse.json({ error: "Start time and end time are required for rescheduling" }, { status: 400 });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
         return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
      }

      // Check for overlap, excluding THIS booking
      const overlappingBooking = await prisma.booking.findFirst({
        where: {
          assetId: booking.assetId,
          id: { not: booking.id },
          status: { in: ["UPCOMING", "ONGOING"] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });

      if (overlappingBooking) {
        return NextResponse.json({ error: "Time slot overlaps with an existing booking" }, { status: 409 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const rescheduled = await tx.booking.update({
          where: { id: params.id },
          data: { 
            startTime: start, 
            endTime: end,
            reminderSentAt: null, // Reset reminder
          },
        });

        await tx.notification.create({
          data: {
            userId: booking.requestedById,
            type: "BOOKING_RESCHEDULED",
            message: `Your booking for ${booking.asset.name} has been rescheduled.`,
            relatedEntityType: "Booking",
            relatedEntityId: booking.id,
          }
        });

        return rescheduled;
      });

      return NextResponse.json(result);
    }

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
