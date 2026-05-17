"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

/**
 * Online image option:
 * This uses a remote premium workspace/business image through normal <img>, so it does not need next/image config.
 *
 * Local image option:
 * Put your preferred image in:
 * public/images/auth-workspace.jpg
 *
 * Then replace the value below with:
 * const AUTH_VISUAL_IMAGE = "/images/auth-workspace.jpg";
 */
const AUTH_VISUAL_IMAGE =
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=85";

function AuthError({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function AuthSuccess({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  onKeyDown,
}: {
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  autoComplete?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="grid gap-2 text-[15px] font-medium text-slate-950">
      <span>{label}</span>
      <div className="group flex h-14 items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-5 shadow-[0_18px_45px_rgba(15,23,42,0.035)] transition focus-within:border-[#0064E0] focus-within:shadow-[0_0_0_4px_rgba(0,100,224,0.08),0_18px_45px_rgba(15,23,42,0.05)]">
        <span className="grid place-items-center text-slate-400 transition group-focus-within:text-[#0064E0]">
          <LockKeyhole size={19} strokeWidth={2.1} />
        </span>

        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium text-slate-950 outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-[#0064E0]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff size={18} strokeWidth={2.1} />
          ) : (
            <Eye size={18} strokeWidth={2.1} />
          )}
        </button>
      </div>
    </label>
  );
}

function PrimaryButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="group flex h-14 w-full items-center justify-center gap-3 rounded-[22px] bg-[#0064E0] px-6 text-[15px] font-medium text-white shadow-[0_22px_45px_rgba(0,100,224,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0052B8] hover:shadow-[0_26px_55px_rgba(0,100,224,0.28)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      <span>{children}</span>
      <ArrowRight
        size={19}
        strokeWidth={2.2}
        className="transition group-hover:translate-x-0.5"
      />
    </button>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setError("");
    setSuccessMessage("");

    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        setError(result.error.message || "Could not reset password.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Password reset successfully. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[#000A16] px-12 py-12 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,100,224,0.24),transparent_32%),radial-gradient(circle_at_90%_72%,rgba(41,190,62,0.16),transparent_30%)]" />

          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center" aria-label="Octalve"><img src="/octalve-logo.svg" alt="Octalve" className="h-16 w-16 object-contain" /></Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-white/70 backdrop-blur">
              <ShieldCheck size={15} />
              Secure Reset
            </div>
          </div>

          <div className="relative z-10 mt-24 max-w-[600px]">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.34em] text-white/60">
              Octalve Workspace
            </p>
            <h1 className="text-[54px] font-medium leading-[0.98] tracking-[-0.055em] text-white xl:text-[68px]">
              Restore secure access to your workspace.
            </h1>
            <p className="mt-7 max-w-[520px] text-[19px] font-medium leading-8 text-white/68">
              Set a new password and continue managing project phases, approvals,
              payments and delivery conversations safely.
            </p>
          </div>

          <div className="relative z-10 mt-auto grid gap-6">
            <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/8 p-3 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur">
              <img
                src={AUTH_VISUAL_IMAGE}
                alt="Professional workspace preview"
                className="h-[260px] w-full rounded-[26px] object-cover opacity-90"
              />

              <div className="absolute left-8 top-8 rounded-2xl border border-white/15 bg-white/90 px-4 py-3 text-slate-950 shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF3FF] text-[#0064E0]">
                    <Check size={19} />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Account security
                    </p>
                    <p className="text-sm font-medium text-slate-950">
                      Protected access
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 rounded-2xl border border-white/15 bg-[#0064E0] px-4 py-3 text-white shadow-[0_18px_45px_rgba(0,100,224,0.28)]">
                <div className="flex items-center gap-3">
                  <WalletCards size={20} />
                  <span className="text-sm font-medium">Workspace ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(0,100,224,0.08),transparent_34%),linear-gradient(180deg,#ffffff,#fbfdff)] px-5 py-10 sm:px-8">
          <div className="w-full max-w-[560px]">
            <div className="mb-9 flex justify-center lg:hidden">
              <Link href="/" className="inline-flex items-center" aria-label="Octalve"><img src="/octalve-logo.svg" alt="Octalve" className="h-16 w-16 object-contain" /></Link>
            </div>

            <div className="mx-auto mb-7 grid h-[86px] w-[86px] place-items-center rounded-[28px] bg-[#EAF3FF] text-[#0064E0] shadow-[0_20px_55px_rgba(0,100,224,0.12)]">
              <LockKeyhole size={34} strokeWidth={2} />
            </div>

            <div className="text-center">
              <h2 className="text-[38px] font-medium leading-tight tracking-[-0.055em] text-[#06142E] sm:text-[46px]">
                Set new password
              </h2>
              <p className="mt-4 text-[17px] font-medium leading-7 text-slate-500">
                Choose a strong password to continue to Octalve Workspace.
              </p>
            </div>

            <div className="mt-9 grid gap-5">
              <AuthError message={error} />
              <AuthSuccess message={successMessage} />

              <PasswordInput
                label="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />

              <PasswordInput
                label="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                onKeyDown={(event) => event.key === "Enter" && handleReset()}
              />

              <PrimaryButton loading={loading} onClick={handleReset}>
                {loading ? "Resetting..." : "Reset password"}
              </PrimaryButton>

              <Link
                href="/login"
                className="mx-auto mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#0064E0]"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>

              <div className="mt-5 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.025)]">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#EAF3FF] text-[#0064E0]">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <p className="font-medium text-slate-950">Password guide</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                      Use at least 8 characters. A mix of letters, numbers and
                      symbols is recommended.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white">
          <section className="flex min-h-screen items-center justify-center px-6">
            <div className="grid gap-4 text-center">
              <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-[#EAF3FF]" />
              <p className="text-sm font-medium text-slate-500">
                Loading secure reset...
              </p>
            </div>
          </section>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}


