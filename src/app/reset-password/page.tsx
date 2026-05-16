"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { Button, Field, Input } from "@/components/portal/UI";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleReset() {
    setError("");
    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new reset link.",
      );
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
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" style={{ gridColumn: "1 / -1" }}>
        <div className="auth-card">
          <h2>Set new password</h2>
          {success ? (
            <div>
              <p style={{ color: "var(--success)", fontWeight: 700 }}>
                ✓ Password reset successfully! Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <p>Enter your new password below.</p>
              <div className="stack">
                {error && (
                  <div
                    style={{
                      background: "var(--danger-soft)",
                      border: "1px solid #fecdd3",
                      color: "var(--danger)",
                      padding: "12px 16px",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {error}
                  </div>
                )}
                <Field label="New password">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm new password">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  />
                </Field>
                <Button onClick={handleReset} disabled={loading}>
                  {loading ? "Resetting..." : "Reset password"}
                </Button>
              </div>
              <div className="auth-links" style={{ marginTop: 18 }}>
                <Link href="/login">Back to login</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-page">
          <section className="auth-panel" style={{ gridColumn: "1 / -1" }}>
            <div className="auth-card">
              <p>Loading...</p>
            </div>
          </section>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
