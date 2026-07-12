/**
 * app/(auth)/forgot-password/page.tsx
 * Sends a password-reset link to the user's email
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#EFF6FF] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="auth-title mb-1">Check your inbox</h2>
            <p className="auth-subtitle">
              If <span className="font-semibold text-[#111827]">{email}</span> is
              registered, you&apos;ll receive a reset link shortly.
            </p>
          </div>
          <Link href="/login" className="auth-link font-semibold flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <Image src="/asset_flow_logo.png" alt="AssetFlow" width={36} height={36} className="rounded-lg" />
          <span className="auth-logo-text">AssetFlow</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Forgot password?</h1>
          <p className="auth-subtitle">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-field">
            <label htmlFor="fp-email" className="form-label">Email address</label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="btn-primary w-full justify-center py-2.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>

        <p className="auth-footer">
          <Link href="/login" className="auth-link flex items-center gap-1.5 justify-center">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
