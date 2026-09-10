"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CircleUserRound,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const workerItems = [
  { href: "/worker/home", label: "Home", icon: Home },
  { href: "/worker/status", label: "Status", icon: Bell },
  { href: "/worker/profile", label: "Profile", icon: UserRound },
];

const employerItems = [
  { href: "/employer/home", label: "Home", icon: Home },
  { href: "/employer/status", label: "Status", icon: Bell },
  { href: "/employer/profile", label: "Profile", icon: CircleUserRound },
];

export function AppShell({
  role,
  displayName,
  children,
}: {
  role: "worker" | "employer";
  displayName?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = role === "worker" ? workerItems : employerItems;

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-svh bg-[#faf9f7] text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-[#faf9f7]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href={role === "worker" ? "/worker/home" : "/employer/home"}
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <span className="grid size-8 place-items-center bg-foreground text-xs font-bold text-background">
              BC
            </span>
            <span className="text-sm font-semibold tracking-wide">
              Beauty Connect
            </span>
          </Link>
          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {role}
              </p>
              <p className="text-sm font-medium">
                {displayName || (role === "worker" ? "Worker" : "Employer")}
              </p>
            </div>
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={signOut}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
          <button
            className="rounded-md p-2 sm:hidden"
            aria-label="Open navigation"
            title="Open navigation"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu className="size-5" />
          </button>
        </div>
        {open ? (
          <div className="border-t border-border px-5 py-3 sm:hidden">
            <p className="mb-2 text-xs text-muted-foreground">
              Signed in as{" "}
              {displayName || (role === "worker" ? "worker" : "employer")}
            </p>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2 py-2 text-sm text-muted-foreground"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        ) : null}
      </header>
      <nav
        aria-label={`${role} navigation`}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-2 backdrop-blur sm:static sm:mx-auto sm:max-w-7xl sm:border-0 sm:bg-transparent sm:px-8 sm:py-0"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1 sm:max-w-none sm:flex sm:gap-2 sm:border-b sm:border-border sm:pb-3 sm:pt-3">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:text-sm",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-8 sm:px-8 sm:pb-12">
        {children}
      </main>
    </div>
  );
}

export function AdminShell({
  children,
  displayName,
}: {
  children: React.ReactNode;
  displayName?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = [
    ["/admin/dashboard", "Dashboard", Home],
    ["/admin/applications", "Applications", BriefcaseBusiness],
    ["/admin/workers", "Workers", UserRound],
    ["/admin/featured", "Featured", Star],
    ["/admin/employers", "Employers", BriefcaseBusiness],
    ["/admin/handshakes", "Handshakes", ShieldCheck],
    ["/admin/notifications", "Notifications", Bell],
    ["/admin/settings", "Settings", CircleUserRound],
  ] as const;
  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <div className="min-h-svh bg-[#faf9f7]">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <span className="grid size-8 place-items-center bg-foreground text-xs font-bold text-background">
              BC
            </span>
            <span className="text-sm font-semibold">
              Admin / Beauty Connect
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {displayName || "Administrator"}
            </span>
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={signOut}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 sm:flex-row sm:px-8">
        <aside className="sm:w-52">
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-1">
            {items.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  pathname === href || pathname.startsWith(`${href}/`)
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
