import { env } from "@/config/env";

const foundationItems = [
  "Next.js App Router",
  "TypeScript strict mode",
  "Tailwind CSS",
  "shadcn/ui configured",
  "Supabase SSR clients",
  "TanStack Query provider",
];

export default function Home() {
  return (
    <main className="flex min-h-svh flex-1 bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col justify-center px-6 py-16 sm:px-10">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase text-muted-foreground">
            Beauty Connect V1
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
            Project foundation is ready.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            This screen confirms the initialization stack only. Product
            workflows, marketplace screens, dashboards, authentication UI, and
            business logic have not been implemented.
          </p>
        </div>

        <div className="mt-12 grid gap-8 border-t border-border pt-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-sm font-medium uppercase text-muted-foreground">
              Environment
            </h2>
            <p className="mt-3 text-lg font-medium">
              {env.supabase.isConfigured
                ? "Supabase variables detected"
                : "Supabase variables missing"}
            </p>
            {!env.supabase.isConfigured ? (
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Add NEXT_PUBLIC_SUPABASE_URL and
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local before using
                Supabase Auth, Database, or Storage.
              </p>
            ) : null}
          </div>

          <div>
            <h2 className="text-sm font-medium uppercase text-muted-foreground">
              Installed Foundation
            </h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {foundationItems.map((item) => (
                <li key={item} className="border-l border-border pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
