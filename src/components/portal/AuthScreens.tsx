"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button, Field, Input } from "./UI";
import type { Role } from "@/lib/types";

const ROLE_PATHS: Record<Role, string> = {
  CLIENT: "/client",
  STAFF: "/staff",
  PROJECT_MANAGER: "/staff",
  SUPER_ADMIN: "/admin",
};

function AuthBrand() {
  return (
    <section className="auth-brand">
      <div className="auth-logo">
        <img src="/octalve-logo.svg" alt="Octalve" className="brand-logo" />
        <span>Octalve Suite</span>
      </div>
      <div>
        <h1>One platform for projects, payments, approvals and delivery.</h1>
        <p>
          Give clients a premium self-service experience while your team manages
          phases, deliverables, payments, reviews and accountability from one
          clean workspace.
        </p>
        <div className="auth-chips">
          <span>Client portal</span>
          <span>Admin control</span>
          <span>Staff delivery</span>
          <span>AI-assisted workflow</span>
        </div>
      </div>
      <p>Premium project operations for Octalve.</p>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
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
      {message}
    </div>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin() {
    console.log("Attempting login for:", email);
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
      console.log("Login result:", result);
      if (result.error) {
        setError(result.error.message || "Invalid email or password.");
        setLoading(false);
        return;
      }
      // Fetch session to determine role and redirect
      const session = await authClient.getSession();
      console.log("Session data:", session.data);
      if (session.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const role = ((session.data.user as any).role ?? "CLIENT") as Role;
        console.log("User role:", role);
        const rolePath = ROLE_PATHS[role];

        // Only redirect to callbackURL if it's compatible with the user's role
        const isValidRedirect = callbackURL && callbackURL.startsWith(rolePath);
        router.push(isValidRedirect ? callbackURL : rolePath);
      } else {
        const isValidRedirect = callbackURL && callbackURL.startsWith("/client");
        router.push(isValidRedirect ? callbackURL : "/client");
      }
    } catch (err) {
      console.error("Login catch error:", err);
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
    <main className="auth-page">
      <AuthBrand />
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your Octalve Suite workspace.</p>
          <div className="stack">
            <AuthError message={error} />
            <button
              className="btn btn-google"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              type="button"
            >
              <GoogleIcon />
              <span>{googleLoading ? "Connecting..." : "Continue with Google"}</span>
            </button>
            <div className="auth-divider">
              <span>or sign in with email</span>
            </div>
            <Field label="Email address">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                type="email"
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </Field>
            <Button onClick={handleLogin} loading={loading} type="button">
              Sign in
            </Button>
          </div>
          <div className="auth-links">
            <Link href="/forgot-password">Forgot password?</Link>
            <Link href="/signup">Create account</Link>
          </div>
        </div>
      </section>
    </main>
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
    <main className="auth-page">
      <AuthBrand />
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Create your account</h2>
          <p>
            Client accounts can request projects, track phases, approve
            deliverables and manage payments.
          </p>
          <div className="stack">
            <AuthError message={error} />
            <button
              className="btn btn-google"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              type="button"
            >
              <GoogleIcon />
              <span>{googleLoading ? "Connecting..." : "Continue with Google"}</span>
            </button>
            <div className="auth-divider">
              <span>or create with email</span>
            </div>
            <Field label="Full name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                autoComplete="name"
              />
            </Field>
            <Field label="Email address">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                type="email"
                autoComplete="email"
              />
            </Field>
            <Field label="Phone number">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="080..."
                autoComplete="tel"
              />
            </Field>
            <Field label="Company / Brand">
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company name"
                autoComplete="organization"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Create password (min. 8 characters)"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm password">
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                placeholder="Confirm password"
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              />
            </Field>
            <Button onClick={handleSignup} disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>
          <div className="auth-links">
            <span /> <Link href="/login">Already have an account?</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
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
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <main className="auth-page">
      <AuthBrand />
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Reset password</h2>
          {success ? (
            <div>
              <p style={{ color: "var(--success)", fontWeight: 700, marginBottom: 16 }}>
                ✓ If an account exists with that email, a reset link has been sent.
              </p>
              <p>Check your inbox (and spam folder) for the password reset link.</p>
              <div className="auth-links" style={{ marginTop: 24 }}>
                <Link href="/login">Back to login</Link>
              </div>
            </div>
          ) : (
            <>
              <p>
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>
              <div className="stack">
                <AuthError message={error} />
                <Field label="Email address">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    type="email"
                    autoComplete="email"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </Field>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </div>
              <div className="auth-links">
                <Link href="/login">Back to login</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
