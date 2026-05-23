"use client";

import type React from "react";
import { ArrowRight } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function PrimaryButton({
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
      className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#0064E0] px-6 text-[15px] font-semibold text-white shadow-[0_18px_36px_rgba(0,100,224,0.20)] transition hover:-translate-y-0.5 hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      <span>{children}</span>
      <ArrowRight
        size={18}
        strokeWidth={2.1}
        className="transition group-hover:translate-x-0.5"
      />
    </button>
  );
}

export function GoogleButton({
  loading,
  children,
  onClick,
}: {
  loading?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      <span>{children}</span>
      <GoogleIcon />
    </button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-1 text-center text-[12px] font-medium text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
