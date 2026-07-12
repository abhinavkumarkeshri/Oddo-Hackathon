require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Efmh1yN5UrsW@ep-broad-smoke-at9bm44s-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1";
console.log("Connection string is:", connectionString);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.user.findFirst().then(console.log).catch(console.error).finally(() => process.exit(0));
