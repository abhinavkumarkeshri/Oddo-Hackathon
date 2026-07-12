/**
 * app/(auth)/layout.tsx
 * Shared layout for all auth pages — centered on a light gray background
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Sign in | AssetFlow",
    template: "%s | AssetFlow",
  },
};

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
