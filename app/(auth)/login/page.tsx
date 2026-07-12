/**
 * app/(auth)/login/page.tsx
 * Sign-in page — Credentials provider (email + password)
 */

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Boxes, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <Image src="/asset_flow_logo.png" alt="AssetFlow" width={36} height={36} className="rounded-lg" />
          <span className="auth-logo-text">AssetFlow</span>
        </div>

        {/* Heading */}
        <div className="auth-header">
          <h1 className="auth-title">Sign in to your account</h1>
          <p className="auth-subtitle">
            Enter your email and password to continue
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="form-label mb-0">
                Password
              </label>
              <Link href="/forgot-password" className="auth-link text-[12px]">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn-primary w-full justify-center py-2.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="auth-footer">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="auth-link font-semibold">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
