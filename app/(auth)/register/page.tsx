/**
 * app/(auth)/register/page.tsx
 * Account creation — name, email, password → sends OTP verification email
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Boxes, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const pwStrong = password.length >= 8;
  const pwMatch  = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pwStrong) { setError("Password must be at least 8 characters."); return; }
    if (!pwMatch)  { setError("Passwords do not match.");                 return; }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Registration failed. Please try again.");
      return;
    }

    // Redirect to OTP verification
    router.push(`/verify?email=${encodeURIComponent(email)}`);
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
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Get started with AssetFlow for free</p>
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
            <label htmlFor="name" className="form-label">Full name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="reg-email" className="form-label">Email address</label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="form-label">Password</label>
            <div className="relative">
              <input
                id="reg-password"
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
            {password.length > 0 && (
              <div className={`flex items-center gap-1.5 mt-1.5 text-[12px] ${pwStrong ? "text-[#16A34A]" : "text-[#D97706]"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {pwStrong ? "Strong password" : "At least 8 characters required"}
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="confirm" className="form-label">Confirm password</label>
            <input
              id="confirm"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`form-input ${confirm.length > 0 && !pwMatch ? "border-[#DC2626] focus:ring-[#DC2626]/20" : ""}`}
            />
            {confirm.length > 0 && !pwMatch && (
              <p className="text-[12px] text-[#DC2626] mt-1">Passwords don&apos;t match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !name || !email || !pwStrong || !pwMatch}
            className="btn-primary w-full justify-center py-2.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/login" className="auth-link font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
