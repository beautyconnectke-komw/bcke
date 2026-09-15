import Link from "next/link";
import { ArrowLeft, CircleHelp, Mail } from "lucide-react";

export function SupportPage({ role }: { role: "worker" | "employer" }) {
  const backHref = role === "worker" ? "/worker/profile" : "/employer/profile";

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
          <CircleHelp className="size-6" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#625b71]">
          Beauty Connect · {role}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1b1b1d]">
          Help centre
        </h1>
        <HelpContent />
      </section>
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
        href="mailto:beautyconnect254@gmail.com"
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
