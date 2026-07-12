/**
 * lib/otp.ts
 * OTP generation, hashing, and verification helpers
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { OtpPurpose } from "@prisma/client";

const OTP_EXPIRY_MINUTES = 10;

/** Generates a random 6-digit numeric code */
export function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * Creates a new OTP record (hashed) in the DB and returns the plain code.
 * Call this server-side, then email the plain code to the user.
 */
export async function createOtp(userId: string, purpose: OtpPurpose): Promise<string> {
  const code = generateOtpCode();
  const hashed = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any existing OTPs of the same purpose for this user
  await prisma.otpToken.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.otpToken.create({
    data: { userId, code: hashed, purpose, expiresAt },
  });

  return code;
}

/**
 * Verifies a plain OTP code and marks it as used.
 * Returns true if valid, false otherwise.
 */
export async function verifyOtp(
  userId: string,
  plainCode: string,
  purpose: OtpPurpose
): Promise<boolean> {
  const tokens = await prisma.otpToken.findMany({
    where: {
      userId,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (!tokens.length) return false;

  const token = tokens[0];
  const isValid = await bcrypt.compare(plainCode, token.code);
  if (!isValid) return false;

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  return true;
}
