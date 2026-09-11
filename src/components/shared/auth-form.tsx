"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/shared/ui";

export function AuthForm({
  mode,
  redirectTo = "/select-role",
  showGoogle = true,
}: {
  mode: "login" | "signup";
  redirectTo?: string;
  showGoogle?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function continueWithGoogle() {
    setError(null);
    setMessage(null);
    setGoogleBusy(true);

    try {
      const supabase = createClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", redirectTo);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth(
        {
          provider: "google",
          options: {
            redirectTo: callbackUrl.toString(),
          },
        },
      );

      if (oauthError) throw oauthError;
      if (!data.url) throw new Error("Could not start Google sign-in.");

      window.location.assign(data.url);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Google sign-in failed.",
      );
      setGoogleBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) {
        setMessage(
          "Account created. Check your email to confirm it, then return here to sign in.",
        );
      } else {
        let destination = "/select-role";
        if (mode === "login" && result.data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", result.data.user.id)
            .maybeSingle();
          if (profile?.role === "admin") {
            destination =
              redirectTo === "/select-role" ? "/admin/dashboard" : redirectTo;
          } else if (profile?.role === "worker") {
            const { data: worker } = await supabase
              .from("worker_profiles")
              .select("verification_status")
              .eq("profile_id", result.data.user.id)
              .maybeSingle();
            destination = !worker
              ? "/worker/onboarding"
              : worker.verification_status === "approved"
                ? "/worker/home"
                : "/worker/status";
          } else if (profile?.role === "employer") {
            const { data: employer } = await supabase
              .from("employer_profiles")
              .select("id")
              .eq("profile_id", result.data.user.id)
              .maybeSingle();
            destination = employer ? "/employer/home" : "/employer/onboarding";
          }
        }
        router.push(destination);
        router.refresh();
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Authentication failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      {showGoogle ? (
        <>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={continueWithGoogle}
            disabled={busy || googleBusy}
          >
            <GoogleIcon />
            {googleBusy ? "Connecting..." : "Continue with Google"}
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or continue with email</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 rounded-md border border-border bg-background px-3 font-normal outline-none focus:border-foreground"
          placeholder="you@example.com"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 rounded-md border border-border bg-background px-3 font-normal outline-none focus:border-foreground"
          placeholder="At least 6 characters"
        />
      </label>
      {mode === "signup" ? (
        <label className="grid gap-2 text-sm font-medium">
          Confirm password
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="h-11 rounded-md border border-border bg-background px-3 font-normal outline-none focus:border-foreground"
          />
        </label>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy
          ? "Please wait..."
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login"
          ? "New to Beauty Connect? "
          : "Already have an account? "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {mode === "login" ? "Create an account" : "Log in"}
        </Link>
      </p>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.72-.06-1.42-.18-2.08H12v3.94h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.88-1.73 2.99-4.28 2.99-7.39Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.38l-3.22-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.08v2.59A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.95A6 6 0 0 1 6.1 12c0-.68.12-1.34.31-1.95V7.46H3.08A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.54l3.33-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.93c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.95 14.7 2 12 2a9.99 9.99 0 0 0-8.92 5.46l3.33 2.59C7.2 7.69 9.4 5.93 12 5.93Z"
      />
    </svg>
  );
}
