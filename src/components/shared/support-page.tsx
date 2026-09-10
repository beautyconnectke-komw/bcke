import Link from "next/link";
import {
  ArrowLeft,
  CircleHelp,
  FileText,
  Mail,
  ShieldCheck,
} from "lucide-react";

type SupportPageKind = "terms" | "privacy" | "help";

export function SupportPage({
  role,
  kind,
}: {
  role: "worker" | "employer";
  kind: SupportPageKind;
}) {
  const isHelp = kind === "help";
  const title = isHelp
    ? "Help centre"
    : kind === "terms"
      ? "Terms & conditions"
      : "Privacy notice";
  const backHref = role === "worker" ? "/worker/profile" : "/employer/profile";
  const Icon = isHelp ? CircleHelp : kind === "terms" ? FileText : ShieldCheck;

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#035715] hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to profile
      </Link>
      <section className="rounded-3xl border border-[#dfe5dc] bg-white p-6 shadow-[0_18px_50px_rgba(26,54,32,0.06)] sm:p-10">
        <div className="grid size-12 place-items-center rounded-2xl bg-[#e8def8] text-[#035715]">
          <Icon className="size-6" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#625b71]">
          Beauty Connect · {role}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1b1b1d]">
          {title}
        </h1>
        {isHelp ? <HelpContent /> : <PlaceholderContent kind={kind} />}
      </section>
    </div>
  );
}

function PlaceholderContent({ kind }: { kind: "terms" | "privacy" }) {
  return (
    <div className="mt-8 space-y-6 text-sm leading-7 text-[#40493e]">
      <p className="rounded-2xl bg-[#f6f3f5] p-4 font-medium text-[#1b1b1d]">
        This is a placeholder for the final{" "}
        {kind === "terms" ? "Terms & Conditions" : "Privacy Notice"}. The
        production policy content will be published here before launch.
      </p>
      <div>
        <h2 className="text-base font-bold text-[#1b1b1d]">
          What this page will cover
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>How Beauty Connect accounts and profiles are used.</li>
          <li>What information is collected and why it is needed.</li>
          <li>Your choices, responsibilities, and support options.</li>
        </ul>
      </div>
      <p className="text-[#707a6d]">
        Last updated: placeholder · Please contact the Beauty Connect team if
        you have questions about this draft.
      </p>
    </div>
  );
}

function HelpContent() {
  return (
    <div className="mt-8 space-y-6 text-sm leading-7 text-[#40493e]">
      <p>
        Find answers about your profile, requests, approvals, and account
        security. Detailed help articles will be added here.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <HelpItem
          title="Profile updates"
          text="Learn which details update instantly and which worker changes need admin approval."
        />
        <HelpItem
          title="Requests and handshakes"
          text="Understand statuses, responses, and what happens after a match."
        />
        <HelpItem
          title="Account security"
          text="Change your password and keep your Beauty Connect account protected."
        />
        <HelpItem
          title="Need more help?"
          text="Send the Beauty Connect team a message and include the screen you are using."
        />
      </div>
      <a
        href="mailto:support@beautyconnect.example"
        className="inline-flex items-center gap-2 font-semibold text-[#035715] hover:underline"
      >
        <Mail className="size-4" /> Contact support
      </a>
    </div>
  );
}

function HelpItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#dfe5dc] p-4">
      <h2 className="font-bold text-[#1b1b1d]">{title}</h2>
      <p className="mt-1 text-[#707a6d]">{text}</p>
    </div>
  );
}
