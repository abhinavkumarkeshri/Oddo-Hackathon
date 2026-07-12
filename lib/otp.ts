/**
 * lib/otp.ts
 * OTP generation, hashing, and verification helpers
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const OTP_EXPIRY_MINUTES = 10;

/** Generates a random 6-digit numeric code */
export function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * Creates a new OTP record (hashed) in the DB and returns the plain code.
 * Call this server-side, then email the plain code to the user.
 */
export async function createOtp(userId: string, purpose: string = "VERIFY"): Promise<string> {
  const code = generateOtpCode();
  const hashed = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      otpCode: hashed,
      otpExpiresAt: expiresAt,
    },
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
  purpose: string = "VERIFY"
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { otpCode: true, otpExpiresAt: true },
  });

  if (!user || !user.otpCode || !user.otpExpiresAt) return false;
  
  if (user.otpExpiresAt < new Date()) {
    return false; // Expired
  }

  const isValid = await bcrypt.compare(plainCode, user.otpCode);
  if (!isValid) return false;

  // Mark used
  await prisma.user.update({
    where: { id: userId },
    data: { otpCode: null, otpExpiresAt: null },
  });

  return true;
}
