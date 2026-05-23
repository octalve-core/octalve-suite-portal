"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import type { Role } from "@/lib/types";
import { AuthError } from "../components/AuthMessages";
import { FieldInput, PasswordInput } from "../components/AuthFields";
import { Divider, GoogleButton, PrimaryButton } from "../components/AuthButtons";
import {
  getPublicAuthError,
  getSafeOAuthCallback,
  getSafeRoleRedirect,
  normalizeEmail,
} from "../auth-security";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const safeEmail = normalizeEmail(email);
    setError("");

    if (!safeEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: safeEmail,
        password,
      });

      if (result.error) {
        setError(
          getPublicAuthError(result.error.message, "Invalid email or password."),
        );
        setLoading(false);
        return;
      }

      const session = await authClient.getSession();
      const role = (((session.data?.user as any)?.role as string) ?? "CLIENT") as Role;
      const redirectTo = getSafeRoleRedirect(callbackURL, role);

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (googleLoading) return;

    setError("");
    setGoogleLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: getSafeOAuthCallback(),
      });
    } catch {
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="grid gap-5">
      <AuthError message={error} />

      <FieldInput
        label="Email"
        icon={<Mail size={18} strokeWidth={2} />}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@company.com"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
      />

      <PasswordInput
        label="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
          <ShieldCheck size={16} className="text-[#0064E0]" />
          Secure session
        </span>

        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-[#0064E0] transition hover:text-[#0052B8]"
        >
          Forgot password?
        </Link>
      </div>

      <PrimaryButton type="submit" loading={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </PrimaryButton>

      <Divider label="or" />

      <GoogleButton loading={googleLoading} onClick={handleGoogleSignIn}>
        {googleLoading ? "Connecting..." : "Sign in with Google"}
      </GoogleButton>

      <p className="pt-5 text-center text-[15px] font-medium text-slate-500">
        Need an account?{" "}
        <Link
          href="/signup"
          className="inline-flex rounded-full bg-[#EAF3FF] px-3 py-1 font-semibold text-[#0064E0] ring-1 ring-[#0064E0]/10 transition hover:bg-[#0064E0] hover:text-white"
        >
          Create account
        </Link>
      </p>
    </form>
  );
}

