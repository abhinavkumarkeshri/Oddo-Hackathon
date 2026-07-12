# AssetFlow — Asset Management Platform

A production-ready asset tracking and management web app built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma**, **NextAuth v5**, and **Neon Postgres**.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom design tokens |
| UI Components | shadcn/ui + lucide-react |
| Auth | NextAuth v5 (Auth.js) — Credentials provider |
| Database | Neon Postgres (serverless) |
| ORM | Prisma v7 |
| Email | Nodemailer (SMTP / Gmail App Password) |
| Images | Cloudinary |

## Folder Structure

```
/app
  /(auth)          → Login, Register, Verify OTP, Forgot/Reset Password
  /api/auth        → register, verify-otp, resend-otp, forgot-password, reset-password
  /dashboard       → Main app shell (sidebar + topbar layout)
/components
  /layout          → Sidebar.tsx, Topbar.tsx
  /ui              → shadcn primitives
/lib
  auth.ts          → NextAuth config (Credentials provider)
  db.ts            → Prisma client singleton
  email.ts         → SMTP email sender + HTML templates
  otp.ts           → OTP generate / verify helpers
  utils.ts         → cn() helper
/prisma
  schema.prisma    → DB schema (User, Org, OtpToken, NextAuth models)
```

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd asset-flow
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:
- **DATABASE_URL** + **DIRECT_URL** — from your [Neon dashboard](https://console.neon.tech) → Connection string (get both Pooled + Direct)
- **AUTH_SECRET** — run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **SMTP_EMAIL** + **SMTP_PASSWORD** — Gmail + App Password
- **CLOUDINARY_*** — from [cloudinary.com](https://cloudinary.com) → Dashboard

### 3. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (first time)
npx prisma migrate dev --name init
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Auth Flow

```
/register  →  POST /api/auth/register  →  OTP email sent
/verify    →  POST /api/auth/verify-otp →  emailVerified set
/login     →  NextAuth signIn("credentials") → JWT session
```

## UI Theme

- **Background**: white `#FFFFFF` / light gray `#F8F9FB`
- **Cards**: white, `border #E5E7EB`, `rounded-xl`, `shadow-sm`
- **Accent**: `#2563EB` (blue) — buttons, links, active states
- **Status**: green (available) · amber (pending) · red (overdue) · gray (retired)
- **Font**: Inter

## Stage Completion

| Stage | Status |
|---|---|
| Stage 0 — Foundation & Auth | ✅ Complete |
| Stage 1 — Assets Directory & Registration | ✅ Complete |
| Stage 2 — Allocations & Transfers | ✅ Complete |
| Stage 3 — Resource Booking Engine | ✅ Complete |
| Stage 4 — Maintenance Workflows | ✅ Complete |
| Stage 5 — Audit Cycles & Email Notifications | ✅ Complete |

