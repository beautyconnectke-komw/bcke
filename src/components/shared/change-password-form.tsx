"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LinkButton } from "@/components/shared/ui";

type PasswordField = "current" | "next" | "confirm";

export function ChangePasswordForm({
  backHref,
  role,
}: {
  backHref: string;
  role: "worker" | "employer";
}) {
  const router = useRouter();
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const rules = {
    length: values.next.length >= 8,
    upper: /[A-Z]/.test(values.next),
    number: /[0-9]/.test(values.next),
    match: values.next.length > 0 && values.next === values.confirm,
  };
  const strength = [
    rules.length,
    rules.upper,
    rules.number,
    rules.match,
  ].filter(Boolean).length;

  function setValue(field: PasswordField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rules.length || !rules.upper || !rules.number)
      return setFeedback({
        tone: "error",
        text: "Use at least 8 characters, one uppercase letter, and one number.",
      });
    if (!rules.match)
      return setFeedback({
        tone: "error",
        text: "Your new passwords do not match.",
      });
    setBusy(true);
    setFeedback(null);
    try {
      const client = createClient();
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError || !user?.email)
        throw new Error("Your session has expired. Please log in again.");
      const { error: verifyError } = await client.auth.signInWithPassword({
        email: user.email,
        password: values.current,
      });
      if (verifyError) throw new Error("Your current password is incorrect.");
      const { error: updateError } = await client.auth.updateUser({
        password: values.next,
      });
      if (updateError) throw updateError;
      setFeedback({
        tone: "success",
        text: "Password updated successfully. Other active sessions may need to sign in again.",
      });
      setValues({ current: "", next: "", confirm: "" });
    } catch (error) {
      setFeedback({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "We could not update your password.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl pb-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <LinkButton href={backHref} variant="ghost" className="px-0">
          <ArrowLeft className="size-4" /> Back
        </LinkButton>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#707a6d]">
          {role} account
        </span>
      </div>
      <section className="rounded-3xl border border-[#dfe5dc] bg-white p-5 shadow-[0_18px_50px_rgba(26,54,32,0.06)] sm:p-8">
        <div className="grid size-12 place-items-center rounded-2xl bg-[#e8def8] text-[#035715]">
          <KeyRound className="size-6" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#1b1b1d]">
          Secure your account
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#707a6d]">
          Create a strong password that you do not reuse for other accounts.
        </p>
        <form onSubmit={submit} className="mt-8 grid gap-5">
          <PasswordInput
            label="Current password"
            value={values.current}
            field="current"
            visible={visible.current}
            onChange={setValue}
            onToggle={() =>
              setVisible((current) => ({
                ...current,
                current: !current.current,
              }))
            }
          />
          <PasswordInput
            label="New password"
            value={values.next}
            field="next"
            visible={visible.next}
            onChange={setValue}
            onToggle={() =>
              setVisible((current) => ({ ...current, next: !current.next }))
            }
          />
          <div className="rounded-2xl bg-[#f6f3f5] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#40493e]">
              <span>Password strength</span>
              <span>
                {strength >= 4
                  ? "Strong"
                  : strength >= 2
                    ? "Getting there"
                    : "Add more detail"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full ${index < strength ? "bg-[#035715]" : "bg-[#dfe5dc]"}`}
                />
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-xs text-[#707a6d]">
              <Rule ok={rules.length} text="At least 8 characters" />
              <Rule ok={rules.upper} text="One uppercase letter" />
              <Rule ok={rules.number} text="One number" />
            </div>
          </div>
          <PasswordInput
            label="Confirm new password"
            value={values.confirm}
            field="confirm"
            visible={visible.confirm}
            onChange={setValue}
            onToggle={() =>
              setVisible((current) => ({
                ...current,
                confirm: !current.confirm,
              }))
            }
          />
          <div className="rounded-2xl border border-[#e8def8] bg-[#f3eef9] p-4 text-sm leading-6 text-[#40493e]">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#035715]" />
              <p>
                Changing your password will help protect your profile and may
                sign out other active sessions.
              </p>
            </div>
          </div>
          {feedback ? (
            <p
              aria-live="polite"
              className={`text-sm ${feedback.tone === "success" ? "text-[#035715]" : "text-red-700"}`}
            >
              {feedback.text}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-[#035715] px-4 text-sm font-bold text-white transition hover:bg-[#024210] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Updating password..." : "Update password"}
          </button>
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="min-h-11 text-sm font-semibold text-[#707a6d] hover:text-[#035715]"
          >
            Keep current password
          </button>
        </form>
      </section>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  field,
  visible,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  field: PasswordField;
  visible: boolean;
  onChange: (field: PasswordField, value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#1b1b1d]">
      {label}
      <span className="relative">
        <input
          required
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(field, event.target.value)}
          className="min-h-12 w-full rounded-xl border border-[#c0c9ba] bg-white px-4 pr-12 text-sm font-normal outline-none transition focus:border-[#035715] focus:ring-4 focus:ring-[#035715]/10"
          autoComplete={
            field === "current" ? "current-password" : "new-password"
          }
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#707a6d] hover:text-[#035715]"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className="flex items-center gap-2">
      {ok ? (
        <Check className="size-4 text-[#035715]" />
      ) : (
        <span className="size-4 rounded-full border border-[#c0c9ba]" />
      )}{" "}
      {text}
    </span>
  );
}
