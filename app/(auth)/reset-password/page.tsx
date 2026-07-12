/**
 * app/(auth)/reset-password/page.tsx
 * Accepts token from URL, lets user set a new password
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Boxes, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  const pwStrong = password.length >= 8;
  const pwMatch  = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pwStrong || !pwMatch) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Reset failed. The link may have expired.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card items-center text-center gap-4">
          <div className="auth-error w-full">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Invalid or missing reset token. Please request a new link.</span>
          </div>
          <Link href="/forgot-password" className="auth-link font-semibold">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="auth-title mb-1">Password reset!</h2>
            <p className="auth-subtitle">Redirecting you to sign in…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Image src="/asset_flow_logo.png" alt="AssetFlow" width={36} height={36} className="rounded-lg" />
          <span className="auth-logo-text">AssetFlow</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Set new password</h1>
          <p className="auth-subtitle">Choose a strong password for your account</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-field">
            <label htmlFor="new-password" className="form-label">New password</label>
            <div className="relative">
              <input
                id="new-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="confirm-password" className="form-label">Confirm password</label>
            <input
              id="confirm-password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`form-input ${confirm.length > 0 && !pwMatch ? "border-[#DC2626] focus:ring-[#DC2626]/20" : ""}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !pwStrong || !pwMatch}
            className="btn-primary w-full justify-center py-2.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting…
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
