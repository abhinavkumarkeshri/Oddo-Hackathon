import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error("❌ Please provide the email address of the user you want to make an admin.");
    console.error("Usage: npx tsx make-admin.ts user@example.com");
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { 
        role: 'ADMIN',
        emailVerified: true // Let's also auto-verify them so you can log right in!
      },
    });

    console.log(`✅ Successfully promoted ${user.email} to ADMIN!`);
    console.log(`You can now log in with this email to access the Org Setup page and promote other users.`);
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ User with email ${email} not found in the database.`);
      console.error(`Please register the user first at /register before running this script.`);
    } else {
      console.error("❌ An error occurred:", error);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
