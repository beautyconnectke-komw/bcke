"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Store,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminDashboardData } from "@/lib/domain/admin-dashboard-types";

const allowedRanges = [7, 30, 90, 365] as const;

const colors = {
  primary: "#035715",
  primaryFixed: "#a7f5a0",
  secondary: "#625b71",
  amber: "#f59e0b",
  red: "#dc2626",
  grid: "#f0edef",
  text: "#1b1b1d",
  muted: "#40493e",
};

const cardClass =
  "rounded-2xl border border-[#c0c9ba]/45 bg-white shadow-[0_6px_20px_rgba(31,17,29,0.035)]";
const innerCardClass =
  "rounded-xl border border-[#c0c9ba]/30 bg-[#f6f3f5]";

function number(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

function changeLabel(change: number | null) {
  if (change === null) return "New activity";
  if (change === 0) return "No change vs prior period";
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}% vs prior period`;
}

function hasValues<T extends Record<string, string | number>>(
  rows: T[],
  keys: string[],
) {
  return rows.some((row) => keys.some((key) => Number(row[key]) > 0));
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-full min-h-48 place-items-center rounded-xl bg-[#f6f3f5] px-6 text-center text-sm text-[#40493e]">
      {message}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#e4e2e4] bg-[#303032] px-3 py-2 text-xs text-[#f3f0f2] shadow-xl">
      <p className="mb-1 font-semibold">{label}</p>
      <div className="grid gap-1">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums">
              {number(Number(item.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon,
  href,
  alert = false,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  href?: string;
  alert?: boolean;
}) {
  const content = (
    <>
      <div className="mb-1 flex items-center justify-between text-[#40493e]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
        <span className={alert ? "text-[#641234]" : "text-[#035715]"}>
          {icon}
        </span>
      </div>
      <div
        className={`my-1 text-2xl font-bold tracking-tight tabular-nums ${alert ? "text-[#641234]" : "text-[#1b1b1d]"}`}
      >
        {number(value)}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${alert ? "bg-[#ffd9e1] text-[#7d2647]" : "bg-[#e8def8] text-[#4a4458]"}`}
        >
          {detail}
        </span>
        {href ? <ChevronRight className="size-4 text-[#707a6d]" /> : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${cardClass} group flex min-h-36 flex-col justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-md`}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className={`${cardClass} flex min-h-36 flex-col justify-between p-4`}>
      {content}
    </article>
  );
}

function PanelHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-[#1b1b1d]">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-[#40493e]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#40493e]">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function AdminDashboard({
  data,
  displayName,
}: {
  data: AdminDashboardData;
  displayName?: string | null;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const hasWorkerGrowth = hasValues(data.workerGrowth, [
    "newSignups",
    "approved",
    "reactivations",
  ]);
  const hasVisitorTrend = hasValues(data.visitorTrend, ["visitors"]);
  const hasEmployerGrowth = hasValues(data.employerGrowth, ["newEmployers"]);
  const hasRequestActivity = hasValues(data.requestActivity, [
    "completed",
    "consideration",
    "declined",
  ]);
  const syncTime = new Date(data.lastSyncedAt).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  function changeRange(value: string) {
    const nextRange = Number(value);
    if (!allowedRanges.includes(nextRange as (typeof allowedRanges)[number])) {
      return;
    }
    router.push(`/admin/dashboard?range=${nextRange}`);
  }

  function refresh() {
    startRefresh(() => router.refresh());
  }

  return (
    <div className="min-h-full bg-[#fcf8fb] text-[#1b1b1d]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#003d0b]">
              Beauty Connect Admin
            </h1>
            <p className="mt-1 text-sm text-[#40493e]">
              Marketplace overview &amp; real-time operations intelligence
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-[#c0c9ba]/45 bg-white px-3 py-2 shadow-sm">
              <CalendarDays className="size-4 text-[#40493e]" />
              <span className="sr-only">Dashboard date range</span>
              <select
                aria-label="Dashboard date range"
                value={data.range}
                onChange={(event) => changeRange(event.target.value)}
                className="bg-transparent text-xs font-semibold text-[#1b1b1d] outline-none"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last 12 Months</option>
              </select>
            </label>
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-[#c0c9ba]/45 bg-white px-3 py-2 text-xs font-semibold text-[#1b1b1d] shadow-sm transition hover:bg-[#f0edef] disabled:opacity-60"
            >
              <RefreshCw className={`size-4 text-[#035715] ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : `Updated ${syncTime}`}
            </button>
            <Link
              href="/admin/notifications"
              aria-label="Open notifications"
              className="relative grid size-10 place-items-center rounded-xl border border-[#c0c9ba]/45 bg-white text-[#1b1b1d] shadow-sm transition hover:bg-[#f0edef]"
            >
              <CircleAlert className="size-4" />
              {data.attention.length > 0 ? (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#ba1a1a] text-[10px] font-bold text-white">
                  {data.attention.length}
                </span>
              ) : null}
            </Link>
            <div className="flex items-center gap-2 rounded-xl border border-[#c0c9ba]/45 bg-white px-2 py-1.5 shadow-sm">
              <div className="grid size-8 place-items-center rounded-full bg-[#003d0b] text-white">
                <ShieldAlert className="size-4" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-none">{displayName || "Administrator"}</p>
                <p className="mt-1 text-[10px] text-[#40493e]">Super Admin</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-[#c0c9ba]/30 bg-[#f6f3f5] px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#035715]" />
            <span className="font-semibold uppercase tracking-[0.12em] text-[#40493e]">
              Dashboard view mode:
            </span>
            <span className="rounded-md bg-[#035715] px-2.5 py-1 font-semibold text-white">
              Live Operations
            </span>
          </div>
          <span className="text-[#40493e]">Last sync: {syncTime}</span>
        </div>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Visitors"
            value={data.kpis.visitors.value}
            detail={changeLabel(data.kpis.visitors.change)}
            icon={<ArrowUpRight className="size-4" />}
          />
          <KpiCard
            label="Active Workers"
            value={data.kpis.activeWorkers.value}
            detail="Approved & live"
            icon={<UsersRound className="size-4" />}
          />
          <KpiCard
            label="Total Workers"
            value={data.kpis.totalWorkers.value}
            detail={changeLabel(data.kpis.totalWorkers.change)}
            icon={<UserRound className="size-4" />}
          />
          <KpiCard
            label="Total Employers"
            value={data.kpis.totalEmployers.value}
            detail={changeLabel(data.kpis.totalEmployers.change)}
            icon={<Store className="size-4" />}
          />
          <KpiCard
            label="Applications"
            value={data.kpis.pendingApplications}
            detail="Needs review"
            icon={<AlertTriangle className="size-4" />}
            href="/admin/applications"
            alert
          />
          <KpiCard
            label="Reactivations"
            value={data.kpis.pendingReactivations}
            detail="Awaiting action"
            icon={<RefreshCw className="size-4" />}
            href="/admin/applications"
            alert
          />
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <article className={`${cardClass} p-5 lg:col-span-7`}>
            <PanelHeading
              title="Worker Growth Trajectory"
              description="New signups, approved workers, and reactivations for the selected period."
              action={
                <div className="flex flex-wrap gap-3">
                  <LegendDot color={colors.primary} label="Approved" />
                  <LegendDot color={colors.secondary} label="New signups" />
                  <LegendDot color={colors.amber} label="Reactivations" />
                </div>
              }
            />
            <div className="h-64">
              {hasWorkerGrowth ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.workerGrowth} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="approvedFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={colors.primary} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="signupFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={colors.secondary} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={colors.secondary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 11 }} minTickGap={20} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="approved" name="Approved" stroke={colors.primary} fill="url(#approvedFill)" strokeWidth={3} />
                    <Area type="monotone" dataKey="newSignups" name="New signups" stroke={colors.secondary} fill="url(#signupFill)" strokeWidth={2} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="reactivations" name="Reactivations" stroke={colors.amber} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No worker lifecycle activity in this period yet." />
              )}
            </div>
          </article>

          <article className={`${cardClass} p-5 lg:col-span-5`}>
            <PanelHeading
              title="Worker Status Distribution"
              description="Current worker lifecycle state from the database."
              action={<span className="rounded-full bg-[#e4e2e4] px-2.5 py-1 text-[11px] font-semibold">{number(data.kpis.totalWorkers.value)} total</span>}
            />
            {data.workerStatus.length ? (
              <div className="flex flex-col items-center gap-5 sm:flex-row">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.workerStatus} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={2} stroke="none">
                        {data.workerStatus.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid w-full gap-2">
                  {data.workerStatus.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                      <span className="font-semibold tabular-nums">{number(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <EmptyChart message="No workers have been added yet." />}
          </article>
        </section>

        <section className={`${cardClass} p-5`}>
          <PanelHeading
            title="Employer Intelligence & Marketplace Health"
            description="Salon acquisition dynamics, matching efficiency, and turnaround benchmarks."
            action={<span className="inline-flex items-center gap-1.5 rounded-full bg-[#a7f5a0] px-3 py-1 text-xs font-bold text-[#005313]"><BadgeCheck className="size-4" /> Health index: {data.marketplaceHealth.healthIndex}/100</span>}
          />
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryMetric label="Total employers" value={data.employerSummary.total} detail="All accounts" />
            <SummaryMetric label="Active employers" value={data.employerSummary.active} detail="Not suspended" />
            <SummaryMetric label="New employers" value={data.employerSummary.newEmployers} detail={data.periodLabel} />
            <SummaryMetric label="Visitors" value={data.kpis.visitors.value} detail={changeLabel(data.kpis.visitors.change)} />
          </div>
          <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-12">
            <div className="h-48 lg:col-span-7">
              {hasEmployerGrowth ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.employerGrowth} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 11 }} minTickGap={20} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="totalEmployers" name="Total employers" stroke={colors.primary} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="No employer acquisition activity in this period yet." />}
            </div>
            <div className="grid gap-3 lg:col-span-5">
              <HealthMetric label="Match success rate" value={`${data.marketplaceHealth.matchSuccessRate.toFixed(1)}%`} detail="Requests completed as handshakes" trend={data.marketplaceHealth.matchSuccessChange} />
              <HealthMetric label="Average time to match" value={data.marketplaceHealth.averageTimeToMatchDays === null ? "—" : `${data.marketplaceHealth.averageTimeToMatchDays.toFixed(1)} days`} detail="Request created to match" />
              <HealthMetric label="New employer acquisition" value={number(data.marketplaceHealth.newEmployers)} detail={data.periodLabel} />
            </div>
          </div>
        </section>

        <section className={`${cardClass} p-5`}>
          <PanelHeading
            title="Request Activity"
            description="Completed handshakes, in-consideration requests, and declined requests over time."
            action={<div className="flex flex-wrap gap-3"><LegendDot color={colors.primary} label="Completed" /><LegendDot color={colors.amber} label="In consideration" /><LegendDot color={colors.red} label="Declined" /></div>}
          />
          <div className="h-72">
            {hasRequestActivity ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.requestActivity} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 11 }} minTickGap={20} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke={colors.primary} strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="consideration" name="In consideration" stroke={colors.amber} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="declined" name="Declined" stroke={colors.red} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No request activity in this period yet." />}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <article className={`${cardClass} p-5 lg:col-span-6`}>
            <PanelHeading title="Request Funnel" description="End-to-end flow from request dispatch to verified handshake." action={<span className="text-xs font-bold text-[#035715]">{data.requestFunnel[3]?.percent.toFixed(1)}% net completion</span>} />
            <div className="grid gap-3">
              {data.requestFunnel.map((stage, index) => (
                <div key={stage.label} className={`${innerCardClass} ${index === 3 ? "border-[#035715]/20 bg-[#a7f5a0]/45" : ""} ${index === 1 ? "ml-3" : ""} ${index === 2 ? "ml-6" : ""} ${index === 3 ? "ml-9" : ""} p-3`}>
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">{index === 3 ? <CheckCircle2 className="size-4 text-[#035715]" /> : null}{index + 1}. {stage.label}</span>
                    <span className="tabular-nums">{number(stage.count)} ({stage.percent.toFixed(1)}%)</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e4e2e4]"><div className={`h-full rounded-full ${index === 3 ? "bg-[#035715]" : "bg-[#625b71]"}`} style={{ width: `${Math.min(100, stage.percent)}%` }} /></div>
                </div>
              ))}
            </div>
          </article>

          <article className={`${cardClass} p-5 lg:col-span-6`}>
            <PanelHeading title="Demand by Speciality" description="Requests submitted across worker specialities." action={<span className="text-xs font-medium text-[#40493e]">Ranked volume</span>} />
            {data.demandBySpecialty.length ? (
              <div className="grid gap-3">
                {data.demandBySpecialty.map((item, index) => {
                  const maximum = data.demandBySpecialty[0]?.requests ?? 1;
                  return <div key={item.specialty}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="font-medium">{index + 1}. {item.specialty}</span><span className="font-bold text-[#035715]">{number(item.requests)} requests</span></div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#f0edef]"><div className={`h-full rounded-full ${index === 1 ? "bg-[#822a4b]" : "bg-[#035715]"}`} style={{ width: `${(item.requests / maximum) * 100}%` }} /></div>
                  </div>;
                })}
              </div>
            ) : <EmptyChart message="No speciality demand has been recorded yet." />}
          </article>
        </section>

        <section className={`${cardClass} p-5`}>
          <PanelHeading title="Supply vs Demand Data" description="Available approved workers compared with employer request volume." action={<span className="rounded-full bg-[#e4e2e4] px-3 py-1 text-xs font-semibold">Selected period: {data.periodLabel}</span>} />
          {data.supplyVsDemand.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead><tr className="bg-[#f6f3f5] text-[11px] uppercase tracking-[0.1em] text-[#40493e]"><th className="rounded-l-xl p-3">Speciality</th><th className="p-3">Available workers</th><th className="p-3">Employer requests</th><th className="p-3">Ratio</th><th className="rounded-r-xl p-3">Market state</th></tr></thead>
                <tbody className="divide-y divide-[#f0edef]">
                  {data.supplyVsDemand.map((item) => <tr key={item.specialty} className="transition hover:bg-[#f6f3f5]/70"><td className="p-3 font-semibold">{item.specialty}</td><td className="p-3 tabular-nums">{number(item.availableWorkers)}</td><td className="p-3 tabular-nums">{number(item.employerRequests)}</td><td className={`p-3 font-bold ${item.state === "critical" ? "text-[#dc2626]" : item.state === "deficit" ? "text-[#d97706]" : item.state === "surplus" ? "text-[#035715]" : "text-[#40493e]"}`}>{item.ratio}</td><td className="p-3"><MarketState item={item} /></td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <EmptyChart message="Supply and demand will appear after workers and requests are available." />}
        </section>

        <section className={`${cardClass} p-5`}>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2"><span className={`size-3 rounded-full ${data.attention.some((item) => item.severity === "urgent") ? "bg-[#dc2626]" : "bg-[#035715]"}`} /><h2 className="text-lg font-bold tracking-tight">Operations Action Center</h2></div>
            <span className="text-xs font-medium text-[#40493e]">{data.attention.length} data-backed flag{data.attention.length === 1 ? "" : "s"}</span>
          </div>
          {data.attention.length ? <div className="grid gap-3">{data.attention.map((item, index) => <AttentionRow key={`${item.category}-${index}`} item={item} />)}</div> : <div className="rounded-xl border border-[#035715]/20 bg-[#a7f5a0]/30 p-4 text-sm text-[#005313]">No operational issues were identified for the selected period.</div>}
        </section>

        {hasVisitorTrend ? (
          <section className={`${cardClass} p-5`}>
            <PanelHeading title="Website Visitor Trend" description="Unique first-party visitor identifiers recorded on public pages." />
            <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.visitorTrend} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}><CartesianGrid stroke={colors.grid} vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 11 }} minTickGap={20} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 11 }} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="visitors" name="Visitors" fill={colors.primary} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className={`${innerCardClass} p-3`}><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#40493e]">{label}</span><div className="mt-1 text-xl font-bold tabular-nums">{number(value)}</div><span className="text-xs font-semibold text-[#035715]">{detail}</span></div>;
}

function HealthMetric({ label, value, detail, trend }: { label: string; value: string; detail: string; trend?: number | null }) {
  return <div className={`${innerCardClass} flex items-center justify-between gap-3 p-3`}><div><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#40493e]">{label}</span><div className="mt-0.5 text-xl font-bold tabular-nums text-[#035715]">{value}</div><p className="mt-0.5 text-xs text-[#40493e]">{detail}</p></div>{trend !== undefined ? <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${trend === null || trend >= 0 ? "bg-[#a7f5a0] text-[#005313]" : "bg-[#ffdad6] text-[#93000a]"}`}>{trend !== null && trend >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{trend === null ? "New" : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`}</span> : null}</div>;
}

function MarketState({ item }: { item: AdminDashboardData["supplyVsDemand"][number] }) {
  const text = item.state === "critical" ? `Critical deficit ${number(Math.abs(item.difference))}` : item.state === "deficit" ? `Moderate deficit ${number(Math.abs(item.difference))}` : item.state === "surplus" ? `Surplus ${number(item.difference)}` : `Balanced ${number(Math.abs(item.difference))}`;
  const className = item.state === "critical" ? "bg-[#ffdad6] text-[#93000a]" : item.state === "deficit" ? "bg-[#ffd9e1] text-[#7d2647]" : item.state === "surplus" ? "bg-[#a7f5a0] text-[#005313]" : "bg-[#e4e2e4] text-[#1b1b1d]";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}>{item.state === "critical" ? <AlertTriangle className="size-3" /> : item.state === "surplus" ? <CheckCircle2 className="size-3" /> : null}{text}</span>;
}

function AttentionRow({ item }: { item: AdminDashboardData["attention"][number] }) {
  const content = <div className="flex items-start gap-3"><span className={`mt-0.5 shrink-0 ${item.severity === "urgent" ? "text-[#dc2626]" : item.severity === "positive" ? "text-[#035715]" : "text-[#641234]"}`}>{item.severity === "urgent" ? <ShieldAlert className="size-5" /> : item.severity === "positive" ? <BadgeCheck className="size-5" /> : <Clock3 className="size-5" />}</span><div><div className="flex flex-wrap items-center gap-2"><span className={`text-[11px] font-bold uppercase tracking-[0.1em] ${item.severity === "urgent" ? "text-[#93000a]" : item.severity === "positive" ? "text-[#035715]" : "text-[#641234]"}`}>{item.severity === "urgent" ? "Urgent" : item.severity === "positive" ? "Marketplace milestone" : "Needs attention"}</span><span className="text-xs text-[#40493e]">• {item.category}</span></div><p className="mt-1 text-sm font-medium leading-5">{item.message}</p></div></div>;
  const row = <div className={`rounded-xl border p-4 ${item.severity === "urgent" ? "border-[#dc2626]/20 bg-[#ffdad6]/25" : item.severity === "positive" ? "border-[#035715]/20 bg-[#a7f5a0]/25" : "border-[#641234]/20 bg-[#ffd9e1]/25"}`}>{content}{item.count !== undefined ? <span className="sr-only">Relevant value: {item.count}</span> : null}</div>;
  return item.href ? <Link href={item.href} className="block transition hover:-translate-y-px">{row}</Link> : row;
}
