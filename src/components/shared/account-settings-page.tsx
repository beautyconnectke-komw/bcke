import Link from "next/link";
import { ArrowLeft, KeyRound, Settings2, Trash2 } from "lucide-react";
import type { CompanyContact } from "@/lib/domain/beauty-connect";
import { DeleteAccountForm } from "@/components/shared/delete-account-form";
import { LinkButton } from "@/components/shared/ui";

export function AccountSettingsPage({
  role,
  companyContact,
}: {
  role: "worker" | "employer";
  companyContact: CompanyContact;
}) {
  const basePath = role === "worker" ? "/worker" : "/employer";
  const profilePath = `${basePath}/profile`;

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <Link
        href={profilePath}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#035715] hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to profile
      </Link>

      <section className="rounded-3xl border border-[#dfe5dc] bg-white p-5 shadow-[0_18px_50px_rgba(26,54,32,0.06)] sm:p-8">
        <div className="grid size-12 place-items-center rounded-2xl bg-[#e8def8] text-[#035715]">
          <Settings2 className="size-6" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#625b71]">
          {role} account
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1b1b1d]">
          Account settings
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#707a6d]">
          Manage your sign-in security and account access.
        </p>

        <div className="mt-8 rounded-2xl border border-[#dfe5dc] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 size-5 shrink-0 text-[#035715]" />
            <div className="min-w-0">
              <h2 className="font-bold text-[#1b1b1d]">Password</h2>
              <p className="mt-1 text-sm leading-6 text-[#707a6d]">
                Update your password and keep your account protected.
              </p>
            </div>
          </div>
          <LinkButton
            href={`${profilePath}/password`}
            variant="secondary"
            className="mt-4 w-full sm:w-auto"
          >
            Change password
          </LinkButton>
        </div>

        <div className="mt-8 border-t border-[#f0edef] pt-8">
          <div className="flex items-start gap-3">
            <Trash2 className="mt-0.5 size-5 shrink-0 text-red-700" />
            <div>
              <h2 className="font-bold text-[#1b1b1d]">Delete account</h2>
              <p className="mt-1 text-sm leading-6 text-[#707a6d]">
                This permanently removes your Beauty Connect account after the
                recovery period. This action cannot be started from your main
                profile page.
              </p>
            </div>
          </div>
          <DeleteAccountForm
            role={role}
            supportPhone={companyContact.phone}
            supportEmail={companyContact.email}
          />
        </div>
      </section>
    </div>
  );
}
