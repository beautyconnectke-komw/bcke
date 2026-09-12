import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

type LegalKind = "terms" | "privacy";

export function GeneralLegalPage({ kind }: { kind: LegalKind }) {
  const isTerms = kind === "terms";
  const title = isTerms ? "Terms & Conditions" : "Privacy Policy";
  const Icon = isTerms ? FileText : ShieldCheck;

  return (
    <main className="min-h-svh bg-[#faf9f7] px-5 py-8 text-[#1b1b1d] sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-[#035715]"
        >
          Beauty Connect
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold text-[#035715] hover:underline"
        >
          Back home
        </Link>
      </header>

      <article className="mx-auto mt-10 max-w-3xl rounded-3xl border border-[#dfe5dc] bg-white p-6 shadow-[0_18px_50px_rgba(26,54,32,0.06)] sm:mt-16 sm:p-10">
        <div className="grid size-12 place-items-center rounded-2xl bg-[#e8def8] text-[#035715]">
          <Icon className="size-6" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#625b71]">
          Beauty Connect · General
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-[#707a6d]">
          Last updated: September 12, 2026
        </p>

        {isTerms ? <TermsContent /> : <PrivacyContent />}

        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#035715] hover:underline"
        >
          <ArrowLeft className="size-4" /> Return to sign up
        </Link>
      </article>
    </main>
  );
}

function TermsContent() {
  return (
    <div className="mt-8 space-y-7 text-sm leading-7 text-[#40493e]">
      <p>
        These terms explain the basic rules for using Beauty Connect to create
        profiles, discover opportunities, and connect beauty professionals with
        salons.
      </p>
      <LegalSection title="Using Beauty Connect">
        You must provide accurate account and profile information and keep your
        login details secure. You are responsible for activity completed through
        your account.
      </LegalSection>
      <LegalSection title="Profiles and connections">
        Beauty Connect may review profiles for authenticity and safety. A match
        or connection does not guarantee employment, payment, or a particular
        business outcome; those arrangements are made between the parties.
      </LegalSection>
      <LegalSection title="Respectful use">
        Do not misuse the service, impersonate another person, send unwanted
        contact, upload unlawful content, or attempt to bypass account or safety
        controls.
      </LegalSection>
      <LegalSection title="Changes and support">
        We may improve the service or update these terms as Beauty Connect
        develops. If you have questions about these terms, contact the Beauty
        Connect support team.
      </LegalSection>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="mt-8 space-y-7 text-sm leading-7 text-[#40493e]">
      <p>
        This policy describes how Beauty Connect uses information needed to
        operate accounts, review profiles, facilitate connections, and keep the
        marketplace safe.
      </p>
      <LegalSection title="Information we use">
        We may use your email, account details, profile information, portfolio
        content, location, and activity on the service to provide and improve
        Beauty Connect.
      </LegalSection>
      <LegalSection title="How information is shared">
        Profile information is shown according to the marketplace experience.
        Direct contact details are shared only when the relevant connection
        rules allow it or when you choose to provide them.
      </LegalSection>
      <LegalSection title="Your choices">
        You can update profile details, manage your account, and contact support
        about access, corrections, or privacy questions.
      </LegalSection>
      <LegalSection title="Security and retention">
        We use reasonable safeguards for account information and retain data
        only as needed for the service, safety, legal, and operational purposes
        described here.
      </LegalSection>
    </div>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-bold text-[#1b1b1d]">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
