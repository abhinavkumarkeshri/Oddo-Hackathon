import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    
    // 1. Asset Utilization (Allocation days last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const allocations = await prisma.allocation.findMany({
      where: {
        allocatedAt: { gte: ninetyDaysAgo },
      },
      include: { asset: true },
    });

    const utilizationMap: Record<string, { assetTag: string; assetName: string; days: number }> = {};
    for (const alloc of allocations) {
      if (!alloc.asset) continue;
      const start = Math.max(alloc.allocatedAt.getTime(), ninetyDaysAgo.getTime());
      const end = alloc.returnedAt ? alloc.returnedAt.getTime() : now.getTime();
      const days = (end - start) / (1000 * 60 * 60 * 24);

      if (!utilizationMap[alloc.assetId]) {
        utilizationMap[alloc.assetId] = {
          assetTag: alloc.asset.assetTag,
          assetName: alloc.asset.name,
          days: 0,
        };
      }
      utilizationMap[alloc.assetId].days += Math.max(0, days);
    }
    
    const assetUtilization = Object.values(utilizationMap)
      .map(u => ({ ...u, days: Math.round(u.days) }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 50); // top 50

    // 2. Maintenance Frequency by Category (last 90 days)
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      include: { asset: { include: { category: true } } },
    });

    const maintFreqMap: Record<string, number> = {};
    for (const req of maintenanceRequests) {
      if (!req.asset?.category) continue;
      const catName = req.asset.category.name;
      maintFreqMap[catName] = (maintFreqMap[catName] || 0) + 1;
    }
    const maintenanceFrequency = Object.entries(maintFreqMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Aging / Poor Condition Assets
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);

    const agingAssets = await prisma.asset.findMany({
      where: {
        OR: [
          { condition: { in: ["POOR", "DAMAGED"] } },
          { acquisitionDate: { lt: fiveYearsAgo } }
        ],
        status: { notIn: ["RETIRED", "DISPOSED"] }
      },
      select: {
        id: true,
        name: true,
        assetTag: true,
        condition: true,
        acquisitionDate: true,
        status: true,
      },
      orderBy: { acquisitionDate: "asc" }
    });

    // 4. Department-wise Allocation Summary
    const departments = await prisma.department.findMany({
      include: {
        allocations: {
          where: { status: "ACTIVE" },
          include: { asset: true },
        }
      }
    });

    const departmentAllocation = departments.map(d => {
      let totalCost = 0;
      let count = d.allocations.length;
      for (const alloc of d.allocations) {
        if (alloc.asset?.acquisitionCost) {
          totalCost += Number(alloc.asset.acquisitionCost);
        }
      }
      return {
        departmentName: d.name,
        allocatedCount: count,
        totalCost: totalCost
      };
    }).sort((a, b) => b.allocatedCount - a.allocatedCount);

    // 5. Resource Booking Heatmap (Day x Hour block over last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const bookings = await prisma.booking.findMany({
      where: {
        startTime: { gte: thirtyDaysAgo },
      },
      select: { startTime: true }
    });

    // Initialize heatmap map
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const heatmap: Record<string, Record<string, number>> = {};
    for (const d of days) {
      heatmap[d] = {};
      for (let h = 0; h < 24; h++) {
        heatmap[d][`${h}:00`] = 0;
      }
    }

    for (const b of bookings) {
      const day = days[b.startTime.getDay()];
      const hour = `${b.startTime.getHours()}:00`;
      if (heatmap[day] && heatmap[day][hour] !== undefined) {
        heatmap[day][hour]++;
      }
    }

    const bookingHeatmap = days.map(d => {
      return { day: d, ...heatmap[d] };
    });

    return NextResponse.json({
      assetUtilization,
      maintenanceFrequency,
      agingAssets,
      departmentAllocation,
      bookingHeatmap,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
