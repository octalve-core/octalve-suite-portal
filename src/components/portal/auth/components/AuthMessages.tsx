"use client";

import type React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function AuthError({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700">
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function AuthHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium leading-5 text-slate-500">
      {children}
    </p>
  );
}
