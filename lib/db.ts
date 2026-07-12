import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Efmh1yN5UrsW@ep-broad-smoke-at9bm44s-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1";

let adapter;
if (connectionString) {
  const pool = new Pool({ connectionString });
  adapter = new PrismaPg(pool);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
