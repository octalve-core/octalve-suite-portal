"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { Role } from "@/lib/types";

const ROLE_PATHS: Record<Role, string> = {
  CLIENT: "/client",
  STAFF: "/staff",
  PROJECT_MANAGER: "/staff",
  SUPER_ADMIN: "/admin",
};

/**
 * Logo note:
 * Current logo path: /octalve-logo.svg
 *
 * For a better full logo later, place it in:
 * public/images/octalve-wordmark.svg
 *
 * Then change LOGO_SRC below to:
 * const LOGO_SRC = "/images/octalve-wordmark.svg";
 */
const LOGO_SRC = "/octalve-logo.svg";

function BrandLockup({ dark = false }: { dark?: boolean }) {
  const logoClass = dark
    ? "block h-16 w-16 object-contain"
    : "block h-16 w-16 object-contain";

  return (
    <Link href="/" className="inline-flex items-center" aria-label="Octalve">
      <img src={LOGO_SRC} alt="Octalve" className={logoClass} />
    </Link>
  );
}
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

function FieldInput({
  label,
  icon,
  right,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-[14px] font-medium text-slate-950">
      <span>{label}</span>
      <div className="group flex h-14 items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 transition focus-within:border-[#0064E0] focus-within:shadow-[0_0_0_4px_rgba(0,100,224,0.08)]">
        <span className="grid place-items-center text-slate-400 transition group-focus-within:text-[#0064E0]">
          {icon}
        </span>
        <input
          {...props}
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium text-slate-950 outline-none placeholder:text-slate-400"
        />
        {right}
      </div>
    </label>
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
    <FieldInput
      label={label}
      icon={<LockKeyhole size={18} strokeWidth={2} />}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      onKeyDown={onKeyDown}
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
      className="group flex h-14 w-full items-center justify-center gap-3 rounded-[18px] bg-[#0064E0] px-6 text-[15px] font-medium text-white shadow-[0_18px_36px_rgba(0,100,224,0.18)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
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

function SecondaryLinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-14 w-full items-center justify-center rounded-[18px] border border-slate-200 bg-white px-6 text-[15px] font-medium text-[#0064E0] transition hover:border-[#0064E0] hover:bg-[#F6FAFF]"
    >
      {children}
    </Link>
  );
}

function GoogleButton({
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
      className="flex h-12 w-full items-center justify-center gap-3 rounded-[18px] border border-slate-200 bg-white px-5 text-[14px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleIcon />
      <span>{children}</span>
    </button>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-1 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function AuthShell({
  mode,
  icon,
  title,
  subtitle,
  children,
}: {
  mode: "login" | "signup" | "forgot";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const leftTitle =
    mode === "signup"
      ? "Create your workspace with structure."
      : mode === "forgot"
        ? "Recover access to your workspace."
        : "Manage projects with clarity.";

  const leftBody =
    mode === "signup"
      ? "Set up a secure client account to request projects, track progress and approve deliverables."
      : mode === "forgot"
        ? "Reset your password and continue managing your project delivery securely."
        : "Sign in to manage project phases, approvals, payments and delivery conversations.";

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[0.82fr_1.18fr]">
        <section className="relative hidden bg-[#000A16] px-12 py-12 text-white lg:flex lg:flex-col xl:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(0,100,224,0.22),transparent_34%),radial-gradient(circle_at_90%_88%,rgba(41,190,62,0.12),transparent_30%)]" />

          <div className="relative z-10">
            <BrandLockup dark />
          </div>

          <div className="relative z-10 my-auto max-w-[560px] py-16">
            <p className="mb-7 text-xs font-medium uppercase tracking-[0.32em] text-white/45">
              Octalve Workspace
            </p>
            <h1 className="text-[52px] font-medium leading-[1.02] tracking-[-0.055em] text-white xl:text-[64px]">
              {leftTitle}
            </h1>
            <p className="mt-7 max-w-[490px] text-[18px] font-medium leading-8 text-white/62">
              {leftBody}
            </p>
          </div>

          <div className="relative z-10 border-t border-white/10 pt-7">
            <p className="max-w-[420px] text-sm font-medium leading-6 text-white/45">
              Structured project delivery, powered by Octalve.
            </p>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-white px-5 py-10 sm:px-8">
          <div className="w-full max-w-[540px]">
            <div className="mb-10 flex justify-center lg:hidden">
              <BrandLockup />
            </div>

            <div className="mx-auto mb-7 grid h-[74px] w-[74px] place-items-center rounded-[24px] bg-[#EAF3FF] text-[#0064E0]">
              {icon}
            </div>

            <div className="text-center">
              <h2 className="text-[36px] font-medium leading-tight tracking-[-0.05em] text-[#06142E] sm:text-[44px]">
                {title}
              </h2>
              <p className="mt-4 text-[16px] font-medium leading-7 text-slate-500">
                {subtitle}
              </p>
            </div>

            <div className="mt-9">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin() {
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      const session = await authClient.getSession();

      if (session.data) {
        const role = ((session.data.user as any).role ?? "CLIENT") as Role;
        const rolePath = ROLE_PATHS[role];
        const isValidRedirect = callbackURL && callbackURL.startsWith(rolePath);

        router.push(isValidRedirect ? callbackURL : rolePath);
      } else {
        const isValidRedirect = callbackURL && callbackURL.startsWith("/client");
        router.push(isValidRedirect ? callbackURL : "/client");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch {
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      mode="login"
      icon={<LockKeyhole size={30} strokeWidth={2} />}
      title="Welcome back"
      subtitle="Sign in to continue to Octalve Workspace."
    >
      <div className="grid gap-5">
        <AuthError message={error} />

        <GoogleButton loading={googleLoading} onClick={handleGoogleSignIn}>
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </GoogleButton>

        <Divider label="or sign in with email" />

        <FieldInput
          label="Email address"
          icon={<Mail size={18} strokeWidth={2} />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          type="email"
          autoComplete="email"
        />

        <PasswordInput
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          onKeyDown={(event) => event.key === "Enter" && handleLogin()}
        />

        <div className="flex items-center justify-between gap-4">
          <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-[#0064E0]"
            />
            Remember me
          </label>

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#0064E0] transition hover:text-[#0052B8]"
          >
            Forgot password?
          </Link>
        </div>

        <PrimaryButton loading={loading} onClick={handleLogin}>
          {loading ? "Signing in..." : "Login"}
        </PrimaryButton>

        <div className="grid gap-4 pt-3 text-center">
          <p className="text-[15px] font-medium text-slate-400">
            Don&apos;t have an account?
          </p>
          <SecondaryLinkButton href="/signup">Create account</SecondaryLinkButton>
        </div>
      </div>
    </AuthShell>
  );
}

export function SignupScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    password: "",
    confirmPassword: "",
  });

  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignup() {
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Name, email and password are required.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the workspace terms before creating your account.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        company: form.company,
      } as any);

      if (result.error) {
        setError(result.error.message || "Could not create account.");
        setLoading(false);
        return;
      }

      router.push("/client");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setError("");
    setGoogleLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch {
      setError("Google sign-up failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      mode="signup"
      icon={<UserRoundPlus size={30} strokeWidth={2} />}
      title="Create your account"
      subtitle="Start managing projects and approvals securely."
    >
      <div className="grid gap-5">
        <AuthError message={error} />

        <GoogleButton loading={googleLoading} onClick={handleGoogleSignUp}>
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </GoogleButton>

        <Divider label="or create with email" />

        <FieldInput
          label="Full name"
          icon={<UserRound size={18} strokeWidth={2} />}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Your full name"
          autoComplete="name"
        />

        <FieldInput
          label="Email address"
          icon={<Mail size={18} strokeWidth={2} />}
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="you@company.com"
          type="email"
          autoComplete="email"
        />

        <div className="grid gap-5 md:grid-cols-2">
          <FieldInput
            label="Phone number"
            icon={<Phone size={18} strokeWidth={2} />}
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
            placeholder="+234..."
            autoComplete="tel"
          />

          <FieldInput
            label="Company / Brand"
            icon={<Building2 size={18} strokeWidth={2} />}
            value={form.company}
            onChange={(event) =>
              setForm({ ...form, company: event.target.value })
            }
            placeholder="Company name"
            autoComplete="organization"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <PasswordInput
            label="Password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            placeholder="Create password"
            autoComplete="new-password"
          />

          <PasswordInput
            label="Confirm password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm({ ...form, confirmPassword: event.target.value })
            }
            placeholder="Repeat password"
            autoComplete="new-password"
            onKeyDown={(event) => event.key === "Enter" && handleSignup()}
          />
        </div>

        <label className="flex items-start gap-3 text-[14px] font-medium leading-6 text-slate-600">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#0064E0]"
          />
          <span>
            I agree to the Octalve Workspace project delivery process.
          </span>
        </label>

        <PrimaryButton loading={loading} onClick={handleSignup}>
          {loading ? "Creating account..." : "Create account"}
        </PrimaryButton>

        <div className="grid gap-4 pt-3 text-center">
          <p className="text-[15px] font-medium text-slate-400">
            Already have an account?
          </p>
          <SecondaryLinkButton href="/login">Login</SecondaryLinkButton>
        </div>
      </div>
    </AuthShell>
  );
}

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setSuccessMessage("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        setError(result.error.message || "Could not send reset link.");
        setLoading(false);
        return;
      }

      setSuccessMessage(
        "If an account exists with that email, a reset link has been sent.",
      );
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <AuthShell
      mode="forgot"
      icon={<ShieldCheck size={30} strokeWidth={2} />}
      title="Reset password"
      subtitle="Enter your email to receive a secure reset link."
    >
      <div className="grid gap-5">
        <AuthError message={error} />
        <AuthSuccess message={successMessage} />

        <FieldInput
          label="Email address"
          icon={<Mail size={18} strokeWidth={2} />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          type="email"
          autoComplete="email"
          onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
        />

        <PrimaryButton loading={loading} onClick={handleSubmit}>
          {loading ? "Sending..." : "Send reset link"}
        </PrimaryButton>

        <Link
          href="/login"
          className="mx-auto mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#0064E0]"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </div>
    </AuthShell>
  );
}


