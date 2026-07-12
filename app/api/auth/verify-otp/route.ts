/**
 * app/api/auth/verify-otp/route.ts
 * POST /api/auth/verify-otp
 * Verifies a 6-digit OTP and marks the user's email as verified
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    if (new Date() > user.otpExpiresAt) {
      return NextResponse.json({ error: "Code has expired." }, { status: 400 });
    }

    const valid = await bcrypt.compare(code, user.otpCode);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    // Mark user as verified
    await prisma.user.update({
      where: { id: user.id },
      data:  { 
        emailVerified: true,
        otpCode: null,
        otpExpiresAt: null
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
