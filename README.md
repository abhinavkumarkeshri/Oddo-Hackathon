# 🏆 AssetFlow — Odoo Hackathon Submission

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

<br/>

**An Enterprise Asset & Resource Management System**

A production-ready, minimalist, and highly secure platform built to simplify and digitize how organizations track, allocate, and maintain their physical assets and shared resources. Built specifically for the **Odoo Hackathon**, this project demonstrates flawless execution of complex ERP logic, role-based workflows, and conflict resolution engines.

## ✨ Features & Stage Completion

We have successfully completed all stages of the hackathon requirements!

| Stage | Status | Highlights |
|---|---|---|
| **0 — Foundation & Auth** | ✅ Complete | Secure RBAC, NextAuth v5, JWT Sessions |
| **1 — Assets Directory** | ✅ Complete | Full CRUD, Search, Filter by Department |
| **2 — Allocations** | ✅ Complete | Asset assignments, Employee transfers |
| **3 — Resource Booking** | ✅ Complete | Calendar integration, conflict resolution |
| **4 — Maintenance** | ✅ Complete | Maintenance lifecycle, Status tracking |
| **5 — Audits & Emails** | ✅ Complete | Automated SMTP alerts, HTML Emails |

## 📧 Automated Email Workflows

AssetFlow features a robust, automated notification engine powered by Nodemailer. Our emails are beautifully designed, responsive, and provide users with real-time updates. 

Here are some examples of our transactional emails:

<div align="center">
  <img src="./public/screenshots/verify-account.jpg" width="30%" alt="Verify Account Email" />
  <img src="./public/screenshots/reset-password.jpg" width="30%" alt="Reset Password Email" />
  <img src="./public/screenshots/maintenance-resolved.jpg" width="30%" alt="Maintenance Resolved Email" />
</div>

*(**Note to Devs**: Save your 3 email screenshots into the `public/screenshots/` folder and name them `verify-account.jpg`, `reset-password.jpg`, and `maintenance-resolved.jpg` for them to display here!)*

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui + lucide-react |
| **Auth** | NextAuth v5 (Auth.js) |
| **Database** | Neon Postgres (Serverless) |
| **ORM** | Prisma v7 |
| **Email** | Nodemailer (Automated Notification Engine) |

## 📁 Architecture & Folder Structure

```text
/app
  /(auth)          → Login, Register, Verify OTP, Forgot/Reset Password
  /api/auth        → Auth endpoints, OTP verification, Password Reset
  /dashboard       → Main application shell (sidebar + topbar layout)
/components
  /layout          → Sidebar.tsx, Topbar.tsx
  /ui              → shadcn primitives & reusable components
/lib
  auth.ts          → NextAuth configuration & Credentials provider
  db.ts            → Prisma client singleton
  email.ts         → SMTP email sender + HTML templates
  otp.ts           → OTP generation & verification helpers
/prisma
  schema.prisma    → Database schema (User, Org, Asset, Allocations, Maintenance, etc.)
```

## 🛠 Getting Started

### 1. Clone and Install

```bash
git clone <repo-url>
cd asset-flow
npm install
```

### 2. Set Up Environment Variables

Duplicate the `.env.example` file and fill in your variables:
```bash
cp .env.example .env
```

Required variables:
- **`DATABASE_URL`** & **`DIRECT_URL`**: Your Neon Postgres connection strings.
- **`AUTH_SECRET`**: Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate one.
- **`SMTP_EMAIL`** & **`SMTP_PASSWORD`**: Gmail App Password or any SMTP provider.
- **`NEXT_PUBLIC_APP_URL`**: `http://localhost:3000` (or your production Vercel URL).

### 3. Initialize the Database

Generate the Prisma client and run the first migration to set up your tables:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run the Development Server

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The app will automatically redirect you to the login screen.

## 🔐 Authentication Flow

AssetFlow utilizes a strictly enforced, state-machine style authentication flow:
1. `/register` → Generates user record and sends OTP email.
2. `/verify` → User inputs OTP, setting `emailVerified`.
3. `/login` → NextAuth `signIn("credentials")` generates a secure JWT session.
4. `/forgot-password` → Generates secure, short-lived reset token and sends HTML email.

## 🎨 UI Theme & Design Philosophy

We prioritized a **premium, minimalist aesthetic** to ensure high user engagement and extreme clarity for enterprise data:
- **Backgrounds**: Pure white `#FFFFFF` and subtle light gray `#F8F9FB`.
- **Cards**: Clean borders (`#E5E7EB`), soft rounded corners (`rounded-xl`), and minimal shadows.
- **Accents**: Crisp blue (`#2563EB`) for all primary actions, buttons, and links.
- **Status Indicators**: Green (Available), Amber (Pending/Maintenance), Red (Overdue/Lost).
- **Typography**: `Inter` for highly legible, modern data tables.
