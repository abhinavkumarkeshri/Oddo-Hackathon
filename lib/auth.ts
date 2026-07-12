/**
 * lib/auth.ts
 * NextAuth v5 (Auth.js) configuration — Credentials provider only.
 * Export `handlers`, `auth`, `signIn`, `signOut` for use across the app.
 */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[Auth] Attempting login for:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials");
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          console.log("[Auth] User not found:", credentials.email);
          return null;
        }
        if (!user.hashedPassword) {
          console.log("[Auth] User has no password set");
          return null;
        }
        if (user.status !== "ACTIVE") {
          console.log("[Auth] User status is not ACTIVE:", user.status);
          return null;
        }

        // Check email verified
        if (!user.emailVerified) {
          console.log("[Auth] User email not verified");
          return null;
        }

        let passwordMatch = false;
        try {
          passwordMatch = await bcrypt.compare(
            String(credentials.password),
            user.hashedPassword
          );
        } catch (e) {
          console.error("[Auth] bcrypt compare error:", e);
        }

        if (!passwordMatch) {
          console.log("[Auth] Password mismatch");
          return null;
        }

        console.log("[Auth] Login successful for:", user.email);
        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
          departmentId: user.departmentId,
        };
      },
    }),
  ],
});
