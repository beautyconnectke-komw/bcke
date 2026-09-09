import Link from "next/link";
import {
  getCurrentEmployerProfile,
  getFeaturedWorkers,
} from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  LinkButton,
  SectionHeading,
  SetupState,
} from "@/components/shared/ui";
import { WorkerCard } from "@/components/employer/worker-card";

export default async function EmployerHomePage() {
  try {
    const [profile, workers] = await Promise.all([
      getCurrentEmployerProfile(),
      getFeaturedWorkers(),
    ]);
    if (!profile)
      return (
        <EmptyState
          title="Complete your salon profile first"
          description="Workers need a clear picture of your business before they can decide whether to connect."
          action={
            <LinkButton href="/employer/onboarding">
              Complete profile
            </LinkButton>
          }
        />
      );
    return (
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Employer home"
          title={`Welcome, ${profile.business_name}.`}
          description="Find the right beauty professional for the work ahead."
          action={
            <LinkButton href="/employer/workers">Find a worker</LinkButton>
          }
        />
        <div className="mt-8 grid gap-5 md:grid-cols-[1fr_1fr]">
          <section className="border border-border bg-foreground p-6 text-background">
            <p className="text-xs uppercase tracking-[0.16em] text-background/60">
              Your next step
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Browse reviewed workers.
            </h2>
            <p className="mt-3 text-sm leading-6 text-background/70">
              Open a profile, see their work, and send a request when the fit
              feels right.
            </p>
            <Link
              href="/employer/workers"
              className="mt-6 inline-flex text-sm font-medium underline underline-offset-4"
            >
              Open marketplace →
            </Link>
          </section>
          <section className="border border-border bg-background p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              How requests work
            </p>
            <ol className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <li>01 Browse workers</li>
              <li>02 Open a profile</li>
              <li>03 Send a request</li>
              <li>04 Wait for their response</li>
              <li>05 Connect when interest is mutual</li>
            </ol>
          </section>
        </div>
        <div className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Marketplace
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Featured workers</h2>
            </div>
            <Link
              href="/employer/workers"
              className="text-sm font-medium underline underline-offset-4"
            >
              View all
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {workers.slice(0, 8).map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
            {workers.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <EmptyState
                  title="No featured workers yet."
                  description="The Beauty Connect team will highlight approved workers here."
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
