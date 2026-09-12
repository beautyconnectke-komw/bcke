import Link from "next/link";
import { ArrowLeft, CircleHelp } from "lucide-react";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="min-h-svh bg-[#fcf8fb] px-4 py-4 text-[#1b1b1d] sm:px-8 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-6xl flex-col sm:min-h-[calc(100svh-3rem)]">
        <header className="flex items-center">
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-2 rounded-full px-1 text-[11px] font-semibold text-[#1b1b1d] transition hover:text-[#035715] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#035715]/30"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.2}
            />
            <span>Beauty Connect</span>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-8 sm:py-12">
          {children}
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-[#e9e5e9] pt-3 text-[9px] text-[#625b71] sm:text-[11px]">
          <span>© Beauty Connect</span>
          <nav className="flex items-center gap-3" aria-label="Account footer">
            <a
              href="mailto:support@beautyconnect.example"
              className="inline-flex items-center gap-1 transition hover:text-[#035715]"
            >
              <CircleHelp aria-hidden="true" className="size-3" />
              Help
            </a>
            <Link className="transition hover:text-[#035715]" href="/privacy">
              Privacy
            </Link>
            <Link className="transition hover:text-[#035715]" href="/terms">
              Terms
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
