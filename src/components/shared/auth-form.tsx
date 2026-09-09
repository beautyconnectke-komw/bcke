"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/shared/ui";

export function AuthForm({
  mode,
  redirectTo = "/select-role",
}: {
  mode: "login" | "signup";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
