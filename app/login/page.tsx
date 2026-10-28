"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginScreen } from "../../src/components/auth/login-screen";
import { withBasePath } from "../../src/lib/routing/base-path";
import { loginFailureMessage } from "../../src/auth/backend-status-client";
import { postLoginPath } from "../../src/auth/config";

export default function LoginPage() {
  const router = useRouter();

  async function authenticate({ email, password }: { email: string; password: string }) {
    const result = await signIn("credentials", { email, password, redirect: false });
    if (!result || result.error || !result.ok) throw new Error(loginFailureMessage(result?.error));

    const refresh = await fetch(withBasePath("/api/auth/refresh"), { method: "POST", credentials: "same-origin" });
    if (!refresh.ok) throw new Error("Unable to establish a secure session.");
    const session = await getSession();
    if (!session?.user?.role) throw new Error("Unable to verify your account. Please sign in again.");
    if (session?.user?.mustChangePassword) {
      router.replace("/change-password");
      router.refresh();
      return;
    }
    if (session?.user?.role) router.replace(postLoginPath(session.user.role));
    router.refresh();
  }

  return <LoginScreen onCredentials={authenticate} />;
}
