"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "./AppContext";
import { Button, Field, Input } from "./UI";
import { Role } from "@/lib/types";

function AuthBrand() {
  return (
    <section className="auth-brand">
      <div className="auth-logo">
        {/* Replace this logo mark with your real Octalve logo image when ready. */}
        {/* <img src="/octalve-logo.svg" alt="Octalve" className="brand-logo" /> */}
        {/* <div className="logo-mark">O</div> */}
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

export function LoginScreen() {
  const { login, resetDemo } = useApp();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("CLIENT");

  return (
    <main className="auth-page">
      <AuthBrand />
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your Octalve Suite workspace.</p>
          <div className="stack">
            <Field label="Email address">
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </Field>
            <Field label="Password">
              <Input type="password" placeholder="••••••••" />
            </Field>
            <Field label="Workspace role">
              <select
                className="input"
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
              >
                <option value="CLIENT">Client</option>
                <option value="STAFF">Staff</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </Field>
            <Button onClick={() => login(role, email)}>Login</Button>
          </div>
          <div className="demo-roles">
            <button onClick={() => login("CLIENT")}>Client demo</button>
            <button onClick={() => login("STAFF")}>Staff demo</button>
            <button onClick={() => login("SUPER_ADMIN")}>Admin demo</button>
          </div>
          <div className="auth-links">
            <Link href="/forgot-password">Forgot password?</Link>
            <Link href="/signup">Create account</Link>
          </div>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 18 }}
            onClick={resetDemo}
          >
            Reset demo data
          </button>
        </div>
      </section>
    </main>
  );
}

export function SignupScreen() {
  const { signup } = useApp();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
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
            <Field label="Full name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
              />
            </Field>
            <Field label="Email address">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
              />
            </Field>
            <Field label="Phone number">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="080..."
              />
            </Field>
            <Field label="Company / Brand">
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company name"
              />
            </Field>
            <Field label="Password">
              <Input type="password" placeholder="Create password" />
            </Field>
            <Field label="Confirm password">
              <Input type="password" placeholder="Confirm password" />
            </Field>
            <Button onClick={() => signup(form)}>Create account</Button>
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
  return (
    <main className="auth-page">
      <AuthBrand />
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Reset password</h2>
          <p>
            Enter your email address and your backend will later send a reset
            link.
          </p>
          <div className="stack">
            <Field label="Email address">
              <Input placeholder="you@company.com" />
            </Field>
            <Button>Send reset link</Button>
          </div>
          <div className="auth-links">
            <Link href="/login">Back to login</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
