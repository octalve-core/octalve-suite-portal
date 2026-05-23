"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Mail, Phone, UserRound } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { AuthError, AuthHint } from "../components/AuthMessages";
import { FieldInput, PasswordInput } from "../components/AuthFields";
import { Divider, GoogleButton, PrimaryButton } from "../components/AuthButtons";
import {
  getPublicAuthError,
  getSafeOAuthCallback,
  hasMinimumPasswordStrength,
  normalizeEmail,
} from "../auth-security";

type SignupFormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  password: string;
  confirmPassword: string;
};

export function SignupForm() {
  const router = useRouter();

  const [form, setForm] = useState<SignupFormState>({
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

  function updateForm<K extends keyof SignupFormState>(
    key: K,
    value: SignupFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const safeName = form.name.trim();
    const safeEmail = normalizeEmail(form.email);
    const safePhone = form.phone.trim();
    const safeCompany = form.company.trim();

    setError("");

    if (!safeName || !safeEmail || !form.password) {
      setError("Name, email and password are required.");
      return;
    }

    if (!hasMinimumPasswordStrength(form.password)) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the workspace delivery process before creating your account.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        name: safeName,
        email: safeEmail,
        password: form.password,
        phone: safePhone,
        company: safeCompany,
      } as any);

      if (result.error) {
        setError(
          getPublicAuthError(result.error.message, "Could not create account."),
        );
        setLoading(false);
        return;
      }

      router.push("/client");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    if (googleLoading) return;

    setError("");
    setGoogleLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: getSafeOAuthCallback(),
      });
    } catch {
      setError("Google sign-up failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignup} className="grid gap-5">
      <AuthError message={error} />

      <FieldInput
        label="Full name"
        icon={<UserRound size={18} strokeWidth={2} />}
        value={form.name}
        onChange={(event) => updateForm("name", event.target.value)}
        placeholder="Your full name"
        autoComplete="name"
        required
      />

      <FieldInput
        label="Email"
        icon={<Mail size={18} strokeWidth={2} />}
        value={form.email}
        onChange={(event) => updateForm("email", event.target.value)}
        placeholder="you@company.com"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldInput
          label="Phone"
          icon={<Phone size={18} strokeWidth={2} />}
          value={form.phone}
          onChange={(event) => updateForm("phone", event.target.value)}
          placeholder="+234..."
          autoComplete="tel"
          inputMode="tel"
        />

        <FieldInput
          label="Company"
          icon={<Building2 size={18} strokeWidth={2} />}
          value={form.company}
          onChange={(event) => updateForm("company", event.target.value)}
          placeholder="Company name"
          autoComplete="organization"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordInput
          label="Password"
          value={form.password}
          onChange={(event) => updateForm("password", event.target.value)}
          placeholder="Create password"
          autoComplete="new-password"
        />

        <PasswordInput
          label="Confirm password"
          value={form.confirmPassword}
          onChange={(event) => updateForm("confirmPassword", event.target.value)}
          placeholder="Repeat password"
          autoComplete="new-password"
        />
      </div>

      <AuthHint>
        Use at least 8 characters. Do not reuse passwords from email, banking, or other admin accounts.
      </AuthHint>

      <label className="flex items-start gap-3 text-[14px] font-medium leading-6 text-slate-600">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#0064E0]"
        />
        <span>I agree to the Octalve Workspace project delivery process.</span>
      </label>

      <PrimaryButton type="submit" loading={loading}>
        {loading ? "Creating account..." : "Create account"}
      </PrimaryButton>

      <Divider label="or" />

      <GoogleButton loading={googleLoading} onClick={handleGoogleSignUp}>
        {googleLoading ? "Connecting..." : "Sign up with Google"}
      </GoogleButton>

      <p className="pt-5 text-center text-[15px] font-medium text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#0064E0] underline underline-offset-4 transition hover:text-[#0052B8]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
