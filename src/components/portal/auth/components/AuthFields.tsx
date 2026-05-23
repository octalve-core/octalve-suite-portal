"use client";

import type React from "react";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export function FieldInput({
  label,
  icon,
  right,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-slate-700">
        {label}
      </span>

      <div
        className={[
          "group flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition",
          "focus-within:border-[#0064E0] focus-within:shadow-[0_0_0_4px_rgba(0,100,224,0.10)]",
          className,
        ].join(" ")}
      >
        {icon ? (
          <span className="grid place-items-center text-slate-400 transition group-focus-within:text-[#0064E0]">
            {icon}
          </span>
        ) : null}

        <input
          {...props}
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {right}
      </div>
    </label>
  );
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldInput
      label={label}
      icon={<LockKeyhole size={18} strokeWidth={2} />}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      right={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-[#0064E0]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff size={18} strokeWidth={2} />
          ) : (
            <Eye size={18} strokeWidth={2} />
          )}
        </button>
      }
    />
  );
}
