import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
  // Clear existing data (optional but good for clean seed)
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditFinding.deleteMany();
  await prisma.auditAssignment.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 1. Departments
  const deptIT = await prisma.department.create({ data: { name: "IT Operations", status: "ACTIVE" } });
  const deptHR = await prisma.department.create({ data: { name: "Human Resources", status: "ACTIVE" } });
  const deptEng = await prisma.department.create({ data: { name: "Engineering", status: "ACTIVE" } });

  // 2. Users (1 Admin, 1 Asset Manager, 1 Dept Head, 4 Employees)
  const hash = await bcrypt.hash("password123", 10);
  
  const admin = await prisma.user.create({
    data: { name: "Ananya Sharma", email: "ananya.sharma@example.com", hashedPassword: hash, role: "ADMIN", departmentId: deptIT.id, emailVerified: true }
  });
  const manager = await prisma.user.create({
    data: { name: "Rahul Patel", email: "rahul.patel@example.com", hashedPassword: hash, role: "ASSET_MANAGER", departmentId: deptIT.id, emailVerified: true }
  });
  const headIT = await prisma.user.create({
    data: { name: "Siddharth Singh", email: "siddharth.singh@example.com", hashedPassword: hash, role: "DEPT_HEAD", departmentId: deptIT.id, emailVerified: true }
  });
  
  // Set dept head
  await prisma.department.update({ where: { id: deptIT.id }, data: { headUserId: headIT.id } });

  const emp1 = await prisma.user.create({ data: { name: "Karan Gupta", email: "karan.gupta@example.com", hashedPassword: hash, role: "EMPLOYEE", departmentId: deptEng.id, emailVerified: true } });
  const emp2 = await prisma.user.create({ data: { name: "Priya Desai", email: "priya.desai@example.com", hashedPassword: hash, role: "EMPLOYEE", departmentId: deptEng.id, emailVerified: true } });
  const emp3 = await prisma.user.create({ data: { name: "Rohan Verma", email: "rohan.verma@example.com", hashedPassword: hash, role: "EMPLOYEE", departmentId: deptHR.id, emailVerified: true } });
  const emp4 = await prisma.user.create({ data: { name: "Sneha Reddy", email: "sneha.reddy@example.com", hashedPassword: hash, role: "EMPLOYEE", departmentId: deptIT.id, emailVerified: true } });

  // 3. Asset Categories
  const catLaptops = await prisma.assetCategory.create({ data: { name: "Laptops", customFieldsJson: { os: "string", memory: "string" } } });
  const catMonitors = await prisma.assetCategory.create({ data: { name: "Monitors", customFieldsJson: { size: "string" } } });
  const catPhones = await prisma.assetCategory.create({ data: { name: "Mobile Phones" } });
  const catFurniture = await prisma.assetCategory.create({ data: { name: "Office Furniture" } });

  // 4. Assets (15 samples across statuses)
  // We need 15 assets covering: AVAILABLE, ALLOCATED, RESERVED, UNDER_MAINTENANCE, LOST, RETIRED, DISPOSED
  const assets = await Promise.all([
    // AVAILABLE (4)
    prisma.asset.create({ data: { name: "MacBook Pro M2", categoryId: catLaptops.id, assetTag: "AF-0001", status: "AVAILABLE", isBookable: true, departmentId: deptEng.id } }),
    prisma.asset.create({ data: { name: "Dell Ultrasharp 27", categoryId: catMonitors.id, assetTag: "AF-0002", status: "AVAILABLE", isBookable: false, condition: "POOR" } }),
    prisma.asset.create({ data: { name: "Conference Projector", categoryId: catMonitors.id, assetTag: "AF-0003", status: "AVAILABLE", isBookable: true } }),
    prisma.asset.create({ data: { name: "Ergonomic Chair", categoryId: catFurniture.id, assetTag: "AF-0004", status: "AVAILABLE" } }),
    // ALLOCATED (4)
    prisma.asset.create({ data: { name: "ThinkPad T14", categoryId: catLaptops.id, assetTag: "AF-0005", status: "ALLOCATED" } }),
    prisma.asset.create({ data: { name: "iPhone 13", categoryId: catPhones.id, assetTag: "AF-0006", status: "ALLOCATED" } }),
    prisma.asset.create({ data: { name: "Standing Desk", categoryId: catFurniture.id, assetTag: "AF-0007", status: "ALLOCATED" } }),
    prisma.asset.create({ data: { name: "LG 34 Ultrawide", categoryId: catMonitors.id, assetTag: "AF-0008", status: "ALLOCATED" } }),
    // UNDER_MAINTENANCE (3)
    prisma.asset.create({ data: { name: "MacBook Air M1", categoryId: catLaptops.id, assetTag: "AF-0009", status: "UNDER_MAINTENANCE" } }),
    prisma.asset.create({ data: { name: "Galaxy S22", categoryId: catPhones.id, assetTag: "AF-0010", status: "UNDER_MAINTENANCE" } }),
    prisma.asset.create({ data: { name: "Meeting Table", categoryId: catFurniture.id, assetTag: "AF-0011", status: "UNDER_MAINTENANCE" } }),
    // LOST / RETIRED / DISPOSED / RESERVED (4)
    prisma.asset.create({ data: { name: "Old ThinkPad", categoryId: catLaptops.id, assetTag: "AF-0012", status: "LOST" } }),
    prisma.asset.create({ data: { name: "Broken Monitor", categoryId: catMonitors.id, assetTag: "AF-0013", status: "RETIRED" } }),
    prisma.asset.create({ data: { name: "Water Damaged Phone", categoryId: catPhones.id, assetTag: "AF-0014", status: "DISPOSED" } }),
    prisma.asset.create({ data: { name: "Test Device", categoryId: catPhones.id, assetTag: "AF-0015", status: "RESERVED" } }),
  ]);

  // 5. Allocations (4 samples, 1 overdue)
  const now = new Date();
  const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const alloc1 = await prisma.allocation.create({ data: { assetId: assets[4].id, userId: emp1.id, status: "ACTIVE", expectedReturnDate: nextWeek } });
  const alloc2 = await prisma.allocation.create({ data: { assetId: assets[5].id, userId: emp2.id, status: "ACTIVE", expectedReturnDate: nextWeek } });
  const alloc3 = await prisma.allocation.create({ data: { assetId: assets[6].id, userId: emp3.id, status: "ACTIVE", expectedReturnDate: nextWeek } });
  // OVERDUE
  const allocOverdue = await prisma.allocation.create({ data: { assetId: assets[7].id, userId: emp4.id, status: "OVERDUE", expectedReturnDate: pastWeek } });

  // 6. TransferRequest (1 pending)
  await prisma.transferRequest.create({ data: { assetId: assets[4].id, fromUserId: emp1.id, toUserId: emp2.id, status: "REQUESTED" } });

  // 7. Bookings (past=COMPLETED, in-progress=ONGOING, upcoming=UPCOMING)
  const past2h = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const past1h = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const future1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const future2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  await prisma.booking.create({ data: { assetId: assets[0].id, requestedById: emp1.id, startTime: past2h, endTime: past1h, status: "COMPLETED" } });
  await prisma.booking.create({ data: { assetId: assets[0].id, requestedById: emp2.id, startTime: past1h, endTime: future1h, status: "ONGOING" } });
  await prisma.booking.create({ data: { assetId: assets[2].id, requestedById: emp3.id, startTime: future1h, endTime: future2h, status: "UPCOMING" } });

  // 8. Maintenance Requests
  await prisma.maintenanceRequest.create({ data: { assetId: assets[8].id, raisedById: emp1.id, priority: "HIGH", status: "PENDING", issueDescription: "Screen flickering" } });
  await prisma.maintenanceRequest.create({ data: { assetId: assets[9].id, raisedById: emp2.id, priority: "MEDIUM", status: "IN_PROGRESS", issueDescription: "Battery drains fast", technicianName: "Amit Kumar" } });
  await prisma.maintenanceRequest.create({ data: { assetId: assets[10].id, raisedById: admin.id, priority: "LOW", status: "RESOLVED", issueDescription: "Wobbly leg", resolvedAt: past1h } });

  // 9. AuditCycle + Findings
  const cycle = await prisma.auditCycle.create({
    data: {
      name: "Q3 IT Audit",
      scopeDepartmentId: deptIT.id,
      startDate: pastWeek,
      endDate: nextWeek,
      status: "OPEN",
      createdById: admin.id,
    }
  });
  await prisma.auditAssignment.create({ data: { auditCycleId: cycle.id, auditorId: emp4.id } });
  await prisma.auditFinding.create({ data: { auditCycleId: cycle.id, assetId: assets[0].id, result: "VERIFIED" } });
  await prisma.auditFinding.create({ data: { auditCycleId: cycle.id, assetId: assets[4].id, result: "MISSING", notes: "Could not find at desk" } });

  // 10. Notifications
  await prisma.notification.create({ data: { userId: emp4.id, type: "Overdue Return Alert", message: "Asset AF-0008 is overdue.", relatedEntityType: "Allocation", relatedEntityId: allocOverdue.id } });
  await prisma.notification.create({ data: { userId: admin.id, type: "Audit Discrepancy Flagged", message: "Asset AF-0005 marked as MISSING.", relatedEntityType: "Asset", relatedEntityId: assets[4].id } });

  // 11. ActivityLog
  await prisma.activityLog.create({ data: { userId: admin.id, action: "ASSET_REGISTERED", entityType: "Asset", entityId: assets[0].id } });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
