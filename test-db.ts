import 'dotenv/config';
import { prisma } from './lib/db';

async function main() {
  console.log("Prisma instance:", !!prisma);
  try {
    const user = await prisma.user.findFirst();
    console.log("User:", user);
  } catch (e) {
    console.error("Error:", e);
  }
}

main().then(() => process.exit(0));
