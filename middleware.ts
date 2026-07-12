/**
 * middleware.ts
 * Route protection:
 * - /dashboard/* → requires login → redirects to /login
 * - /login, /register, /verify, /forgot-password, /reset-password → if already logged in → redirect to /dashboard
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isLoggedIn  = !!req.auth;
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isApiRoute = pathname.startsWith("/api");
  const isAuthApiRoute = pathname.startsWith("/api/auth");

  // Unauthenticated user hitting dashboard → send to login
  if (isDashboard && !isLoggedIn) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting auth pages → send to dashboard
  if (isAuthRoute && isLoggedIn) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.searchParams.delete("callbackUrl");
    return NextResponse.redirect(dashboardUrl);
  }

  // Unauthenticated user hitting protected API routes → return 401
  if (isApiRoute && !isAuthApiRoute && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
