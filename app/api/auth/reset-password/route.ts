/**
 * app/api/auth/reset-password/route.ts
 * POST /api/auth/reset-password
 * Validates the token and updates the user's hashed password
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // Find the user by reset token
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired or is invalid. Please request a new one." },
        { status: 400 }
      );
    }

    // Update password and clear reset token
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  { 
        hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
