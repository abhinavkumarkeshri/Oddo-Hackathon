/**
 * app/api/auth/resend-otp/route.ts
 * POST /api/auth/resend-otp
 * Re-issues a new OTP and sends it via email (rate-limited implicitly by createOtp invalidating old ones)
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
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    const plainOtp = generateOtpCode();
    const otpCode = await bcrypt.hash(plainOtp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt }
    });

    await sendEmail({
      to:      user.email,
      subject: "Verify your AssetFlow account",
      html:    otpEmailHtml(plainOtp, 10),
      text:    `Your code is: ${plainOtp}\n\nExpires in 10 minutes.`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[resend-otp]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
