"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { AuthError, AuthSuccess } from "../components/AuthMessages";
import { FieldInput } from "../components/AuthFields";
import { PrimaryButton } from "../components/AuthButtons";
import { getPublicAuthError, normalizeEmail } from "../auth-security";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const safeEmail = normalizeEmail(email);
    setError("");
    setSuccessMessage("");

    if (!safeEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.requestPasswordReset({
        email: safeEmail,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        setError(
          getPublicAuthError(result.error.message, "Could not send reset link."),
        );
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
    <form onSubmit={handleSubmit} className="grid gap-5">
      <AuthError message={error} />
      <AuthSuccess message={successMessage} />

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

      <PrimaryButton type="submit" loading={loading}>
        {loading ? "Sending..." : "Send reset link"}
      </PrimaryButton>

      <Link
        href="/login"
        className="mx-auto mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#0064E0]"
      >
        <ArrowLeft size={16} />
        Back to login
      </Link>
    </form>
  );
}
