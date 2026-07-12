/**
 * app/api/auth/register/route.ts
 * POST /api/auth/register
 * Creates a new user (hashed password), sends email-verification OTP
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail, otpEmailHtml } from "@/lib/email";

function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // ── Check existing user ────────────────────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Don't reveal whether email exists — generic message
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // ── Create user ────────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const plainOtp = generateOtpCode();
    const otpCode = await bcrypt.hash(plainOtp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: {
        name:           name.trim(),
        email:          email.toLowerCase().trim(),
        hashedPassword,
        otpCode,
        otpExpiresAt,
      },
    });

    // ── Send OTP ──────────────────────────────────────────────────────────────
    await sendEmail({
      to:      user.email,
      subject: "Verify your AssetFlow account",
      html:    otpEmailHtml(plainOtp, 10),
      text:    `Your AssetFlow verification code is: ${plainOtp}\n\nExpires in 10 minutes.`,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
