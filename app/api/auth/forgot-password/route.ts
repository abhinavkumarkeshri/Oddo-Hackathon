/**
 * app/api/auth/forgot-password/route.ts
 * POST /api/auth/forgot-password
 * Generates a password-reset token and emails a secure link
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate a secure 64-char hex token
    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store as a VerificationToken (reusing the NextAuth model)
    await prisma.verificationToken.upsert({
      where:  { identifier_token: { identifier: email, token: "reset" } },
      update: { token, expires },
      create: { identifier: email, token, expires },
    });

    const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendEmail({
      to:      user.email,
      subject: "Reset your AssetFlow password",
      html:    passwordResetEmailHtml(resetUrl),
      text:    `Reset your password: ${resetUrl}\n\nThis link expires in 60 minutes.`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
