import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  try {
    const count = await p.user.count();
    console.log("DB connection successful, user count:", count);
  } catch (err) {
    console.error("DB connection failed:", err);
  } finally {
    await p.$disconnect();
  }
}

main();
