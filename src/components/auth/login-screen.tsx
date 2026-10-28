"use client";

import React, { useState } from "react";
import { Button, Card, Field } from "../ui";
import { withBasePath } from "../../lib/routing/base-path";
import { loginThrownErrorMessage } from "../../auth/backend-status-client";

export function LoginScreen({ onCredentials }: { onCredentials: (credentials: { email: string; password: string }) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"idle" | "signing-in" | "redirecting">("idle");
  const pending = phase !== "idle";

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    setPhase("signing-in");
    setError("");
    try {
      await onCredentials({ email: normalizedEmail, password });
      // Keep the in-card progress state visible until the destination route
      // replaces this page. The successful handler starts router navigation.
      setPhase("redirecting");
    } catch (cause) {
      setError(loginThrownErrorMessage(cause));
      setPhase("idle");
    }
  };

  return <main className="login-background grid min-h-screen place-items-center p-4 sm:p-6">
    <Card as="div" className="relative z-10 w-full max-w-[460px] overflow-hidden p-0">
      <div className="bg-navy leading-[0]"><img src={withBasePath("/brand-header.jpg")} alt="AB Ignite" className="block h-auto w-full" /></div>
      <div className="p-6 sm:px-7 sm:pb-7">
        <h1 className="text-[28px] font-medium tracking-[-.02em]">Sign in</h1>
        <p className="mt-[-2px] text-[15px] text-muted">Share ideas, improve what exists, and shape what’s next.</p>
        <form className="mt-[18px]" onSubmit={signIn} noValidate>
          <fieldset disabled={pending} className="m-0 min-w-0 border-0 p-0">
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="name@company.com" required />
            <Field label="Password" type="password" value={password} onChange={setPassword} className="mt-3" required />
          </fieldset>
          {error && <p className="mt-3 text-[13.5px] font-medium text-[#c22b45]" role="alert">{error}</p>}
          <Button type="submit" variant="primary" className="mt-3 w-full" disabled={pending}>
            {phase === "redirecting" ? "Opening your workspace…" : pending ? "Signing in…" : "Sign in"}
          </Button>
          {pending && <div className="mt-4 flex min-h-10 items-center justify-center gap-3 rounded-lg border border-blue/15 bg-blue/[0.04] px-3 py-2" role="status" aria-live="polite">
            <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-blue/20 border-t-blue" />
            <span className="text-sm text-muted">{phase === "redirecting" ? "Your secure session is ready. Loading your workspace…" : "Verifying your sign-in securely…"}</span>
          </div>}
          <p className="mt-4 text-center text-sm text-muted"><a className="font-medium text-blue underline underline-offset-4" href={withBasePath("/status")}>Check service status</a></p>
        </form>
      </div>
    </Card>
  </main>;
}
