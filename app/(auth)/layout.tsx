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

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
