import { prisma } from "@/lib/db";

export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  detailsJson?: any
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        detailsJson: detailsJson || null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
