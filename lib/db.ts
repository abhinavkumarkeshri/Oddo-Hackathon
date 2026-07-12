import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { sendEmail, notificationEmailHtml } from './email';

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Efmh1yN5UrsW@ep-broad-smoke-at9bm44s-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1";

let adapter;
if (connectionString) {
  const pool = new Pool({ connectionString });
  adapter = new PrismaPg(pool);
}

const basePrisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

const extendedPrisma = basePrisma.$extends({
  query: {
    notification: {
      async create({ args, query }) {
        const result = await query(args);
        
        basePrisma.user.findUnique({ where: { id: result.userId } }).then(u => {
          if (u?.email) {
             const title = result.type || "AssetFlow Notification";
             sendEmail({
               to: u.email,
               subject: title,
               html: notificationEmailHtml(title, result.message)
             }).catch(console.error);
          }
        }).catch(console.error);
        
        return result;
      },
      async createMany({ args, query }) {
        const result = await query(args);
        
        const dataArray = Array.isArray(args.data) ? args.data : [args.data];
        for (const notif of dataArray) {
           basePrisma.user.findUnique({ where: { id: notif.userId } }).then(u => {
              if (u?.email) {
                 const title = notif.type || "AssetFlow Notification";
                 sendEmail({
                   to: u.email,
                   subject: title,
                   html: notificationEmailHtml(title, notif.message)
                 }).catch(console.error);
              }
           }).catch(console.error);
        }
        return result;
      }
    }
  }
});

const globalForPrisma = globalThis as unknown as { prismaExtended: typeof extendedPrisma };

export const prisma = globalForPrisma.prismaExtended ?? extendedPrisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaExtended = prisma;
