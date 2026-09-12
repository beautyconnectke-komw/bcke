"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Mail, Phone } from "lucide-react";
import {
  requestAccountDeletionAction,
  verifyAccountPasswordAction,
} from "@/app/actions/beauty-connect";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/shared/ui";

export function DeleteAccountForm({
  role,
  supportPhone,
  supportEmail,
}: {
  role: "worker" | "employer";
  supportPhone: string | null;
  supportEmail: string | null;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"password" | "warning" | "done">("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verifyPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await verifyAccountPasswordAction(password);
      setStep("warning");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not verify your password.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeletion() {
    setBusy(true);
    setError(null);
    try {
      await requestAccountDeletionAction(password);
      setStep("done");
      await createClient().auth.signOut();
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not schedule your account deletion.",
      );
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        <p>
          Your account deletion has been scheduled. You have been signed out.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-[#f0edef] pt-5">
      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-700" />
          <div>
            <h3 className="text-sm font-bold text-[#1b1b1d]">Delete account</h3>
            <p className="mt-1 text-sm leading-6 text-[#625b71]">
              Permanently remove your Beauty Connect {role} account after the
              recovery period.
            </p>
          </div>
        </div>

        {step === "password" ? (
          <form onSubmit={verifyPassword} className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-semibold text-[#1b1b1d]">
              Enter your password to confirm
              <input
                required
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                className="min-h-11 w-full rounded-xl border border-[#c0c9ba] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#b42318] focus:ring-4 focus:ring-red-700/10"
                autoComplete="current-password"
              />
            </label>
            <Button
              type="submit"
              variant="danger"
              disabled={busy}
              className="w-fit"
            >
              {busy ? "Checking password..." : "Continue"}
            </Button>
          </form>
        ) : (
          <div className="mt-4 grid gap-4">
            <div className="rounded-xl border border-red-200 bg-white p-4 text-sm leading-6 text-[#40493e]">
              <p className="font-semibold text-red-800">
                Please read before continuing
              </p>
              <p className="mt-2">
                Your account data will not be permanently deleted until 30 days
                have passed. If you want to retrieve your account during that
                period, contact Beauty Connect using the details below.
              </p>
              <div className="mt-3 grid gap-2 font-semibold">
                {supportEmail ? (
                  <a
                    href={`mailto:${supportEmail}`}
                    className="flex items-center gap-2 text-[#035715] hover:underline"
                  >
                    <Mail className="size-4" /> {supportEmail}
                  </a>
                ) : null}
                {supportPhone ? (
                  <a
                    href={`tel:${supportPhone}`}
                    className="flex items-center gap-2 text-[#035715] hover:underline"
                  >
                    <Phone className="size-4" /> {supportPhone}
                  </a>
                ) : null}
                {!supportEmail && !supportPhone ? (
                  <p className="font-normal text-red-700">
                    Beauty Connect contact details have not been configured yet.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={confirmDeletion}
              >
                {busy ? "Scheduling deletion..." : "Delete my account"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setStep("password");
                  setPassword("");
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        {error ? (
          <p className="mt-3 text-sm text-red-700" aria-live="polite">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
