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
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });

        if (!user || !user.hashedPassword || user.status !== "ACTIVE") return null;

        // Check email verified
        if (!user.emailVerified) return null;

        const passwordMatch = await bcrypt.compare(
          String(credentials.password),
          user.hashedPassword
        );

        if (!passwordMatch) return null;

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
