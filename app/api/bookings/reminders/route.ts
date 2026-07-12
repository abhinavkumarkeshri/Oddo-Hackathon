import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find UPCOMING bookings starting within the next 30 minutes with reminderSentAt null
    const now = new Date();
    const next30Mins = new Date(now.getTime() + 30 * 60000);

    const bookingsToRemind = await prisma.booking.findMany({
      where: {
        status: "UPCOMING",
        startTime: {
          lte: next30Mins,
          gt: now,
        },
        reminderSentAt: null,
      },
      include: {
        asset: true,
      }
    });

    if (bookingsToRemind.length === 0) {
      return NextResponse.json({ message: "No reminders to send" });
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const booking of bookingsToRemind) {
        // Send Notification
        await tx.notification.create({
          data: {
            userId: booking.requestedById,
            type: "BOOKING_REMINDER",
            message: `Reminder: Your booking for ${booking.asset.name} starts soon at ${booking.startTime.toLocaleTimeString()}.`,
            relatedEntityType: "Booking",
            relatedEntityId: booking.id,
          }
        });

        // Set reminderSentAt
        await tx.booking.update({
          where: { id: booking.id },
          data: { reminderSentAt: new Date() },
        });

        // In a real app, send email here too.
      }
    });

    return NextResponse.json({ message: `Sent ${bookingsToRemind.length} reminders.` });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
