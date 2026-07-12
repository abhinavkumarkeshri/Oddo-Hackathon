import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user;
    const isGlobal = ["ADMIN", "ASSET_MANAGER"].includes(user.role);
    const departmentId = user.departmentId;
    const userId = user.id;

    // Build common where clauses for scoping
    const assetWhere = isGlobal ? {} : { departmentId };
    const allocationWhere = isGlobal 
      ? { status: "ACTIVE" } 
      : (user.role === "DEPT_HEAD" && departmentId 
          ? { status: "ACTIVE", departmentId } 
          : { status: "ACTIVE", userId });

    const maintenanceWhere = isGlobal ? {} : { asset: { departmentId } };
    
    // For pending transfers, Asset Manager sees all. Dept head sees transfers where fromUser belongs to their dept
    const transferWhere = isGlobal 
      ? { status: "REQUESTED" } 
      : { status: "REQUESTED", fromUser: { departmentId } };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    // Queries
    const [
      assetsAvailable,
      assetsAllocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
      overdueReturns,
    ] = await Promise.all([
      prisma.asset.count({ where: { ...assetWhere, status: "AVAILABLE" } }),
      prisma.asset.count({ where: { ...assetWhere, status: "ALLOCATED" } }),
      
      prisma.maintenanceRequest.count({
        where: {
          ...maintenanceWhere,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),

      prisma.booking.count({
        where: {
          status: { in: ["UPCOMING", "ONGOING"] },
          ...(isGlobal ? {} : { departmentId }),
        },
      }),

      prisma.transferRequest.count({ where: transferWhere }),

      prisma.allocation.count({
        where: {
          ...allocationWhere,
          expectedReturnDate: { gt: new Date(), lte: next7Days },
        },
      }),

      // For overdue returns, return actual items to list them
      prisma.allocation.findMany({
        where: {
          ...allocationWhere,
          expectedReturnDate: { lt: new Date() },
        },
        include: {
          asset: { select: { name: true, assetTag: true } },
          user: { select: { name: true } },
        },
        orderBy: { expectedReturnDate: "asc" },
      }),
    ]);

    return NextResponse.json({
      assetsAvailable,
      assetsAllocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
      overdueReturnsList: overdueReturns,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
