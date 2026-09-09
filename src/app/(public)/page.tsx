import Link from "next/link";
import { ArrowUpRight, Check, ShieldCheck, Sparkles } from "lucide-react";

const steps = {
  worker: [
    "Create your profile",
    "Submit it for review",
    "Discover opportunities",
    "Respond to salon requests",
  ],
  employer: [
    "Create your salon profile",
    "Browse trusted workers",
    "Send a request",
    "Connect when interest is mutual",
  ],
};

export default function Home() {
  return (
    <main className="bg-[#faf9f7] text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center bg-foreground text-xs font-bold text-background">
            BC
          </span>
          <span className="text-sm font-semibold tracking-wide">
            Beauty Connect
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background"
          >
            Get started
          </Link>
        </nav>
      </header>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-16 pt-8 sm:px-8 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-24">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="size-3.5" /> A more thoughtful beauty
            marketplace
          </p>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.98] tracking-tight sm:text-7xl">
            The right people make the work beautiful.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            Beauty Connect helps salons find trusted beauty workers and helps
            workers discover real opportunities.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center gap-2 bg-foreground px-5 text-sm font-medium text-background"
            >
              Get started <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center border border-border px-5 text-sm font-medium hover:bg-background"
            >
              Log in
            </Link>
          </div>
        </div>
        <div
          className="relative min-h-[28rem] overflow-hidden bg-[#b8654e]"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1400&q=85')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-[#3c251d]/15" />
          <div className="absolute bottom-5 left-5 max-w-[15rem] border-l-2 border-white/70 pl-4 text-sm leading-6 text-white">
            Human skill, trusted connections, and a better way to find the next
            opportunity.
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A clearer path for both sides of the chair.
            </h2>
          </div>
          <div className="mt-10 grid gap-12 lg:grid-cols-2">
            <Path title="For Workers" steps={steps.worker} />
            <Path title="For Employers" steps={steps.employer} />
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <ShieldCheck className="size-7" />
          <h2 className="mt-5 text-3xl font-semibold tracking-tight">
            Trust is part of the product.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            Worker profiles are reviewed before they appear in the marketplace.
            The goal is a more useful first conversation for salons and
            professionals alike.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TrustItem title="Reviewed profiles" />
          <TrustItem title="Real opportunities" />
          <TrustItem title="Human connections" />
        </div>
      </section>
      <section className="bg-[#24211f] text-[#faf9f7]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              Start here
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Bring your next good connection closer.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center bg-[#faf9f7] px-5 text-sm font-medium text-[#24211f]"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center border border-white/30 px-5 text-sm font-medium"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl justify-between px-5 py-8 text-xs text-muted-foreground sm:px-8">
        <span>Beauty Connect V1</span>
        <span>Made for the beauty industry.</span>
      </footer>
    </main>
  );
}

function Path({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <ol className="mt-5 grid gap-4">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-4 border-t border-border pt-4 text-sm"
          >
            <span className="font-mono text-xs text-muted-foreground">
              0{index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
function TrustItem({ title }: { title: string }) {
  return (
    <div className="border-t border-border pt-4">
      <Check className="size-4" />
      <p className="mt-4 text-sm font-medium">{title}</p>
    </div>
  );
}
