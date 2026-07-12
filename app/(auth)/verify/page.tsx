/**
 * app/(auth)/verify/page.tsx
 * Email OTP verification — 6-digit code sent after registration
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

export default function VerifyPage() {
  const router  = useRouter();
  const params  = useSearchParams();
  const email   = params.get("email") ?? "";

  const [code, setCode]         = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleChange(idx: number, val: string) {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = char;
    setCode(next);
    if (char && idx < 5) refs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...code];
    text.split("").forEach((c, i) => { next[i] = c; });
    setCode(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  const fullCode = code.join("");

  async function handleVerify() {
    if (fullCode.length < 6) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, code: fullCode, purpose: "EMAIL_VERIFY" }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Invalid or expired code. Please try again.");
      setCode(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login?verified=1"), 1500);
  }

  async function handleResend() {
    setResending(true);
    setError("");
    await fetch("/api/auth/resend-otp", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, purpose: "EMAIL_VERIFY" }),
    });
    setResending(false);
    setCountdown(60);
    setCode(["", "", "", "", "", ""]);
    refs.current[0]?.focus();
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="auth-title mb-1">Email verified!</h2>
            <p className="auth-subtitle">Redirecting you to sign in…</p>
          </div>
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
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-[#111827]">{email}</span>
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* OTP Input Grid */}
        <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { refs.current[idx] = el; }}
              id={`otp-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-12 text-center text-lg font-bold border border-[#E5E7EB] rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]
                         transition-colors bg-white text-[#111827]"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || fullCode.length < 6}
          className="btn-primary w-full justify-center py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify email"
          )}
        </button>

        {/* Resend */}
        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-[13px] text-[#9CA3AF]">
              Resend code in <span className="font-medium text-[#6B7280]">{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-1.5 mx-auto text-[13px] text-[#2563EB] font-medium hover:underline disabled:opacity-60"
            >
              {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Resend code
            </button>
          )}
        </div>

        <p className="auth-footer">
          Wrong email?{" "}
          <Link href="/register" className="auth-link font-semibold">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
