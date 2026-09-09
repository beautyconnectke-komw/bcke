import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="min-h-svh bg-[#faf9f7] px-5 py-6 sm:px-8">
      <header className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid size-8 place-items-center bg-foreground text-xs font-bold text-background">
            BC
          </span>
          <span className="text-sm font-semibold">Beauty Connect</span>
        </Link>
      </header>
      <div className="mx-auto flex min-h-[calc(100svh-6rem)] max-w-6xl items-center justify-center py-12">
        {children}
      </div>
    </main>
  );
}
