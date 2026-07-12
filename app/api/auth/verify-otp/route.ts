/**
 * app/api/auth/verify-otp/route.ts
 * POST /api/auth/verify-otp
 * Verifies a 6-digit OTP and marks the user's email as verified
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { OtpPurpose } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { email, code, purpose } = await req.json();

    if (!email || !code || !purpose) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    const valid = await verifyOtp(user.id, code, purpose as OtpPurpose);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    // If this is email verification, mark user as verified
    if (purpose === "EMAIL_VERIFY") {
      await prisma.user.update({
        where: { id: user.id },
        data:  { emailVerified: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
