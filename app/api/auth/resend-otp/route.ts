/**
 * app/api/auth/resend-otp/route.ts
 * POST /api/auth/resend-otp
 * Re-issues a new OTP and sends it via email (rate-limited implicitly by createOtp invalidating old ones)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createOtp } from "@/lib/otp";
import { sendEmail, otpEmailHtml } from "@/lib/email";
import { OtpPurpose } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { email, purpose } = await req.json();

    if (!email || !purpose) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    const code = await createOtp(user.id, purpose as OtpPurpose);

    const subject =
      purpose === "EMAIL_VERIFY"
        ? "Verify your AssetFlow account"
        : "Your AssetFlow OTP code";

    await sendEmail({
      to:      user.email,
      subject,
      html:    otpEmailHtml(code, 10),
      text:    `Your code is: ${code}\n\nExpires in 10 minutes.`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[resend-otp]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
