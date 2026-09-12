"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/shared/ui";

const legalDocuments = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
] as const;

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
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  async function continueWithGoogle() {
    setError(null);
    setMessage(null);
    if (mode === "signup" && !acceptedLegal) {
      setError("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }
    setGoogleBusy(true);

    try {
      const supabase = createClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", redirectTo);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

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
    if (mode === "signup" && !acceptedLegal) {
      setError("Please agree to the Terms & Conditions and Privacy Policy.");
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
        setShowConfirmationModal(true);
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

  const isSignup = mode === "signup";
  const inputClass = isSignup
    ? "h-10 w-full border-0 border-b border-[#d8d3da] bg-transparent pl-8 pr-8 text-[11px] text-[#1b1b1d] outline-none transition placeholder:text-[#8a858d] focus:border-[#6750a4]"
    : "h-10 w-full rounded-lg border border-[#eeebee] bg-[#f8f7f8] pl-8 pr-8 text-[11px] text-[#1b1b1d] outline-none transition placeholder:text-[#8a858d] focus:border-[#035715] focus:bg-white";

  return (
    <>
      <form
        onSubmit={submit}
        className={
          isSignup
            ? "grid gap-3"
            : "grid gap-3 rounded-2xl border border-[#e8e5e8] bg-white p-3 shadow-[0_8px_22px_rgba(27,27,29,0.04)]"
        }
      >
        <label className="grid gap-1 text-[10px] font-semibold text-[#1b1b1d]">
          <span>
            Email{isSignup ? <span className="text-[#b42318]"> *</span> : null}
          </span>
          <span className="relative">
            <Mail
              aria-hidden="true"
              className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-[#77717b]"
              strokeWidth={1.8}
            />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder={
                isSignup
                  ? "name@beautystudio.com"
                  : "e.g. elena@beautyconnect.com"
              }
              autoComplete="email"
            />
          </span>
        </label>

        <label className="grid gap-1 text-[10px] font-semibold text-[#1b1b1d]">
          <span>
            Password
            {isSignup ? <span className="text-[#b42318]"> *</span> : null}
          </span>
          <span className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-[#77717b]"
              strokeWidth={1.8}
            />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              placeholder={isSignup ? "Minimum 8 characters" : "••••••••••••"}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
            <PasswordToggle
              visible={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
              label="password"
              className={isSignup ? "text-[#77717b]" : "text-[#77717b]"}
            />
          </span>
        </label>

        {isSignup ? (
          <label className="grid gap-1 text-[10px] font-semibold text-[#1b1b1d]">
            <span>
              Confirm Password <span className="text-[#b42318]">*</span>
            </span>
            <span className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-[#77717b]"
                strokeWidth={1.8}
              />
              <input
                type={showConfirm ? "text" : "password"}
                required
                minLength={6}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className={inputClass}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              <PasswordToggle
                visible={showConfirm}
                onClick={() => setShowConfirm((visible) => !visible)}
                label="confirmation password"
                className="text-[#77717b]"
              />
            </span>
          </label>
        ) : null}

        {!isSignup ? (
          <div className="flex items-center justify-between gap-3 text-[9px] text-[#625b71]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck
                aria-hidden="true"
                className="size-3.5 text-[#035715]"
              />
              Secure sign-in
            </span>
            <span>Encrypted &amp; private</span>
          </div>
        ) : (
          <label className="flex items-start gap-2 text-[10px] leading-4 text-[#625b71]">
            <input
              type="checkbox"
              required
              checked={acceptedLegal}
              onChange={(event) => {
                setAcceptedLegal(event.target.checked);
                if (event.target.checked) setError(null);
              }}
              className="mt-0.5 size-3.5 shrink-0 accent-[#6750a4]"
              aria-describedby="legal-consent-copy"
            />
            <span id="legal-consent-copy">
              I agree to the{" "}
              {legalDocuments.map((document, index) => (
                <span key={document.href}>
                  {index > 0 ? " and " : null}
                  <Link
                    href={document.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#6750a4] underline underline-offset-2"
                  >
                    {document.label}
                  </Link>
                </span>
              ))}
              .
            </span>
          </label>
        )}

        {error ? (
          <p className="text-[10px] leading-4 text-[#b42318]" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-[10px] leading-4 text-[#035715]" role="status">
            {message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={busy || googleBusy}
          className={`min-h-10 w-full rounded-lg text-[11px] font-bold ${
            isSignup
              ? "bg-[#625b71] text-white hover:bg-[#514a60]"
              : "bg-[#035715] text-white hover:bg-[#024210]"
          }`}
        >
          {busy ? "Please wait..." : isSignup ? "Create Account" : "Log In"}
          <span aria-hidden="true" className="text-sm">
            →
          </span>
        </Button>

        {showGoogle ? (
          <>
            <div className="flex items-center gap-2 text-[9px] text-[#8a858d]">
              <span className="h-px flex-1 bg-[#ebe8eb]" />
              <span>{isSignup ? "Or continue with" : "Or continue with"}</span>
              <span className="h-px flex-1 bg-[#ebe8eb]" />
            </div>
            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={busy || googleBusy}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#f0edf0] bg-white text-[10px] font-semibold text-[#1b1b1d] transition hover:border-[#c9c1cc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GoogleIcon />
              {googleBusy ? "Connecting..." : "Google"}
            </button>
          </>
        ) : null}

        <p className="text-center text-[10px] text-[#625b71]">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-[#1b1b1d] underline underline-offset-2"
          >
            {isSignup ? "Log In" : "Sign Up"}
          </Link>
        </p>
      </form>

      {showConfirmationModal ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#1b1b1d]/45 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#e8def8] bg-white p-6 shadow-[0_24px_80px_rgba(27,27,29,0.2)] sm:p-8">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#e8def8] text-[#035715]">
              <Mail aria-hidden="true" className="size-5" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#6750a4]">
              One more step
            </p>
            <h2
              id="confirmation-title"
              className="mt-2 text-2xl font-bold tracking-tight text-[#1b1b1d]"
            >
              Check your confirmation email
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#625b71]">
              We sent a confirmation link to{" "}
              <strong className="text-[#1b1b1d]">{email}</strong>. Open it to
              verify your account, then come back here and log in.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href="googlegmail://"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#dfe5dc] px-4 text-sm font-semibold text-[#1b1b1d] hover:border-[#035715] hover:text-[#035715] sm:hidden"
              >
                Open Gmail app
              </a>
              <a
                href="https://mail.google.com/mail/u/0/#inbox"
                target="_blank"
                rel="noreferrer"
                className="hidden min-h-11 items-center justify-center rounded-xl border border-[#dfe5dc] px-4 text-sm font-semibold text-[#1b1b1d] hover:border-[#035715] hover:text-[#035715] sm:inline-flex"
              >
                Open Gmail
              </a>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#035715] px-4 text-sm font-semibold text-white hover:bg-[#023c0e] sm:col-span-2"
              >
                Go to Login
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmationModal(false)}
              className="mt-4 w-full text-center text-xs font-semibold text-[#86868b] hover:text-[#035715]"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PasswordToggle({
  visible,
  onClick,
  label,
  className,
}: {
  visible: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute right-2 top-1/2 -translate-y-1/2 transition hover:text-[#035715] ${className ?? ""}`}
      aria-label={`${visible ? "Hide" : "Show"} ${label}`}
    >
      <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-3.5"
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
