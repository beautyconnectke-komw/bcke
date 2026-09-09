import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-foreground text-background hover:bg-foreground/90",
        variant === "secondary" &&
          "border border-border bg-background text-foreground hover:bg-muted",
        variant === "ghost" &&
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  className,
  variant = "primary",
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition hover:-translate-y-px",
        variant === "primary" &&
          "bg-foreground text-background hover:bg-foreground/90",
        variant === "secondary" &&
          "border border-border bg-background text-foreground hover:bg-muted",
        variant === "ghost" &&
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong while loading this page.",
}: {
  message?: string;
}) {
  return (
    <EmptyState title="We could not load this yet" description={message} />
  );
}

export function SetupState({ detail }: { detail?: string } = {}) {
  return (
    <EmptyState
      title="Supabase is not connected"
      description={
        detail && process.env.NODE_ENV === "development"
          ? detail
          : "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local, then refresh this page."
      }
    />
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "success" && "bg-emerald-100 text-emerald-800",
        tone === "warning" && "bg-amber-100 text-amber-800",
        tone === "danger" && "bg-red-100 text-red-800",
      )}
    >
      {children}
    </span>
  );
}
