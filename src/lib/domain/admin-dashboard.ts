import "server-only";

import { getAuthContext } from "@/lib/domain/auth";
import { DomainError } from "@/lib/domain/errors";
import type { DashboardRange } from "@/lib/domain/admin-dashboard-types";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

type Supabase = SupabaseClient<Database, "public">;
type CategoryRow = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name" | "is_active" | "display_order"
>;
type SupplyWorkerRow = Pick<
  Database["public"]["Tables"]["worker_profiles"]["Row"],
  "id" | "category_id" | "extra_specialty_ids"
>;
type WorkerPeriodRow = Pick<
  Database["public"]["Tables"]["worker_profiles"]["Row"],
  "created_at"
>;
type EmployerPeriodRow = Pick<
  Database["public"]["Tables"]["employer_profiles"]["Row"],
  "created_at"
>;
type RequestRow = Pick<
  Database["public"]["Tables"]["employer_requests"]["Row"],
  "id" | "worker_profile_id" | "status" | "created_at" | "updated_at"
>;
type HandshakeRow = Pick<
  Database["public"]["Tables"]["handshakes"]["Row"],
  | "request_id"
  | "status"
  | "matched_at"
  | "completed_at"
  | "created_at"
>;
type ActivityRow = Pick<
  Database["public"]["Tables"]["admin_activity"]["Row"],
  "action" | "created_at"
>;
type VisitorRow = Pick<
  Database["public"]["Tables"]["website_visits"]["Row"],
  "visitor_id" | "created_at"
>;

const dayInMilliseconds = 24 * 60 * 60 * 1000;
const primary = "#035715";
const secondary = "#625b71";
const amber = "#f59e0b";
const red = "#dc2626";
const darkAmber = "#d97706";

export const dashboardRanges: DashboardRange[] = [7, 30, 90, 365];

function isDashboardRange(value: number): value is DashboardRange {
  return dashboardRanges.includes(value as DashboardRange);
}

export function parseDashboardRange(value?: string | string[]): DashboardRange {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw ?? 30);
  return isDashboardRange(parsed) ? parsed : 30;
}

function getWindow(range: DashboardRange) {
  const end = new Date();
  if (range === 365) {
    const start = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1),
    );
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 12, 1),
    );
    return { start, end, previousStart, previousEnd };
  }
  const start = new Date(end.getTime() - (range - 1) * dayInMilliseconds);
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(
    previousEnd.getTime() - (range - 1) * dayInMilliseconds,
  );

  return { start, end, previousStart, previousEnd };
}

function inRange(value: string | null, start: Date, end: Date) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return timestamp >= start.getTime() && timestamp <= end.getTime();
}

function bucketKey(value: string | Date, range: DashboardRange) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  if (range === 365) return `${year}-${month}`;
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createBucketKeys(start: Date, end: Date, range: DashboardRange) {
  const keys: string[] = [];
  if (range === 365) {
    const cursor = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
    );
    const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    while (cursor <= last) {
      keys.push(bucketKey(cursor, range));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return keys;
  }

  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const last = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );
  while (cursor <= last) {
    keys.push(bucketKey(cursor, range));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function bucketLabel(key: string, range: DashboardRange) {
  const date = new Date(`${key}${range === 365 ? "-01" : ""}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: range === 365 ? undefined : "numeric",
  }).format(date);
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function countByBucket(
  values: string[],
  keys: string[],
  range: DashboardRange,
) {
  const counts = new Map(keys.map((key) => [key, 0]));
  for (const value of values) {
    const key = bucketKey(value, range);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function ensureNoError(error: { message: string } | null, source: string) {
  if (error) {
    throw new DomainError(`Could not load ${source}.`);
  }
}

function specialtyIdsForWorker(worker: {
  category_id: string | null;
  extra_specialty_ids: string[];
}) {
  return [
    ...(worker.category_id ? [worker.category_id] : []),
    ...worker.extra_specialty_ids,
  ];
}

function getSupplyDemandState(
  availableWorkers: number,
  employerRequests: number,
): "critical" | "deficit" | "balanced" | "surplus" {
  if (employerRequests > 0 && availableWorkers === 0) return "critical";
  if (employerRequests > availableWorkers * 2) return "critical";
  if (employerRequests > availableWorkers) return "deficit";
  if (availableWorkers > employerRequests * 1.2) return "surplus";
  return "balanced";
}

function ratioLabel(availableWorkers: number, employerRequests: number) {
  if (employerRequests === 0) return "—";
  if (availableWorkers === 0) return "0 : 1";
  if (availableWorkers >= employerRequests) {
    return `${round(availableWorkers / employerRequests)} : 1`;
  }
  return `1 : ${round(employerRequests / availableWorkers)}`;
}

async function getRequestedWorkerRows(
  supabase: Supabase,
  workerIds: string[],
): Promise<SupplyWorkerRow[]> {
  if (workerIds.length === 0) return [];
  const { data, error } = await supabase
    .from("worker_profiles")
    .select("id, category_id, extra_specialty_ids")
    .in("id", workerIds);
  ensureNoError(error, "requested worker specialties");
  return data ?? [];
}

export const getAdminDashboardData = cache(
  async (range: DashboardRange) => {
    const { supabase, profile } = await getAuthContext();
    if (profile?.role !== "admin") {
      throw new DomainError("Admin authorization is required.");
    }

    const { start, end, previousStart, previousEnd } = getWindow(range);
    const previousStartIso = previousStart.toISOString();
    const endIso = end.toISOString();
    const periodKeys = createBucketKeys(start, end, range);

    const [
      totalWorkersResult,
      activeWorkersResult,
      pendingApplicationsResult,
      suspendedWorkersResult,
      pendingReactivationsResult,
      totalEmployersResult,
      activeEmployersResult,
      workerPeriodRowsResult,
      supplyWorkersResult,
      categoriesResult,
      employerPeriodRowsResult,
      requestRowsResult,
      handshakeRowsResult,
      activityRowsResult,
      visitorRowsResult,
    ] = await Promise.all([
      supabase.from("worker_profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("worker_profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "approved")
        .eq("is_suspended", false),
      supabase
        .from("worker_profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "pending_review"),
      supabase
        .from("worker_profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_suspended", true),
      supabase
        .from("worker_reactivation_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("employer_profiles")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("employer_profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_suspended", false),
      supabase
        .from("worker_profiles")
        .select("created_at")
        .gte("created_at", previousStartIso)
        .lte("created_at", endIso),
      supabase
        .from("worker_profiles")
        .select("id, category_id, extra_specialty_ids")
        .eq("verification_status", "approved")
        .eq("is_suspended", false),
      supabase
        .from("categories")
        .select("id, name, is_active, display_order")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("employer_profiles")
        .select("created_at")
        .gte("created_at", previousStartIso)
        .lte("created_at", endIso),
      supabase
        .from("employer_requests")
        .select("id, worker_profile_id, status, created_at, updated_at")
        .gte("created_at", previousStartIso)
        .lte("created_at", endIso),
      supabase
        .from("handshakes")
        .select("request_id, status, matched_at, completed_at, created_at")
        .gte("created_at", previousStartIso)
        .lte("created_at", endIso),
      supabase
        .from("admin_activity")
        .select("action, created_at")
        .gte("created_at", previousStartIso)
        .lte("created_at", endIso)
        .in("action", ["worker_approved", "worker_reactivation_approved"]),
      supabase
        .from("website_visits")
        .select("visitor_id, created_at")
        .gte("created_at", previousStartIso)
        .lte("created_at", endIso),
    ]);

    ensureNoError(totalWorkersResult.error, "worker totals");
    ensureNoError(activeWorkersResult.error, "active workers");
    ensureNoError(pendingApplicationsResult.error, "pending applications");
    ensureNoError(suspendedWorkersResult.error, "suspended workers");
    ensureNoError(pendingReactivationsResult.error, "pending reactivations");
    ensureNoError(totalEmployersResult.error, "employer totals");
    ensureNoError(activeEmployersResult.error, "active employers");
    ensureNoError(workerPeriodRowsResult.error, "worker growth");
    ensureNoError(supplyWorkersResult.error, "worker supply");
    ensureNoError(categoriesResult.error, "specialities");
    ensureNoError(employerPeriodRowsResult.error, "employer growth");
    ensureNoError(requestRowsResult.error, "request activity");
    ensureNoError(handshakeRowsResult.error, "handshake activity");
    ensureNoError(activityRowsResult.error, "worker lifecycle activity");

    const totalWorkers = totalWorkersResult.count ?? 0;
    const activeWorkers = activeWorkersResult.count ?? 0;
    const pendingApplications = pendingApplicationsResult.count ?? 0;
    const suspendedWorkers = suspendedWorkersResult.count ?? 0;
    const pendingReactivations = pendingReactivationsResult.count ?? 0;
    const totalEmployers = totalEmployersResult.count ?? 0;
    const activeEmployers = activeEmployersResult.count ?? 0;
    const workerPeriodRows = (workerPeriodRowsResult.data ?? []) as WorkerPeriodRow[];
    const supplyWorkers = (supplyWorkersResult.data ?? []) as SupplyWorkerRow[];
    const categories = (categoriesResult.data ?? []) as CategoryRow[];
    const employerPeriodRows = (employerPeriodRowsResult.data ?? []) as EmployerPeriodRow[];
    const requestRows = (requestRowsResult.data ?? []) as RequestRow[];
    const handshakeRows = (handshakeRowsResult.data ?? []) as HandshakeRow[];
    const activityRows = (activityRowsResult.data ?? []) as ActivityRow[];
    // Website analytics is additive. The dashboard remains usable while the
    // analytics migration is being rolled out to an environment.
    const visitorRows = visitorRowsResult.error
      ? []
      : ((visitorRowsResult.data ?? []) as VisitorRow[]);

    const currentRequests = requestRows.filter((row) =>
      inRange(row.created_at, start, end),
    );
    const previousRequests = requestRows.filter((row) =>
      inRange(row.created_at, previousStart, previousEnd),
    );
    const currentWorkers = workerPeriodRows.filter((row) =>
      inRange(row.created_at, start, end),
    );
    const previousWorkers = workerPeriodRows.filter((row) =>
      inRange(row.created_at, previousStart, previousEnd),
    );
    const currentEmployers = employerPeriodRows.filter((row) =>
      inRange(row.created_at, start, end),
    );
    const previousEmployers = employerPeriodRows.filter((row) =>
      inRange(row.created_at, previousStart, previousEnd),
    );
    const currentVisitors = visitorRows.filter((row) =>
      inRange(row.created_at, start, end),
    );
    const previousVisitors = visitorRows.filter((row) =>
      inRange(row.created_at, previousStart, previousEnd),
    );

    const currentUniqueVisitors = new Set(
      currentVisitors.map((row) => row.visitor_id),
    ).size;
    const previousUniqueVisitors = new Set(
      previousVisitors.map((row) => row.visitor_id),
    ).size;

    const approvedActivity = activityRows.filter(
      (row) => row.action === "worker_approved",
    );
    const reactivationActivity = activityRows.filter(
      (row) => row.action === "worker_reactivation_approved",
    );
    const newWorkerCounts = countByBucket(
      currentWorkers.map((row) => row.created_at),
      periodKeys,
      range,
    );
    const approvedCounts = countByBucket(
      approvedActivity
        .filter((row) => inRange(row.created_at, start, end))
        .map((row) => row.created_at),
      periodKeys,
      range,
    );
    const reactivationCounts = countByBucket(
      reactivationActivity
        .filter((row) => inRange(row.created_at, start, end))
        .map((row) => row.created_at),
      periodKeys,
      range,
    );
    const workerGrowth = periodKeys.map((date) => ({
      date,
      label: bucketLabel(date, range),
      newSignups: newWorkerCounts.get(date) ?? 0,
      approved: approvedCounts.get(date) ?? 0,
      reactivations: reactivationCounts.get(date) ?? 0,
    }));

    const inactiveWorkers = Math.max(
      0,
      totalWorkers - activeWorkers - pendingApplications - suspendedWorkers,
    );
    const workerStatus = [
      { name: "Active", value: activeWorkers, color: primary },
      { name: "Inactive", value: inactiveWorkers, color: secondary },
      { name: "Pending Applications", value: pendingApplications, color: amber },
      {
        name: "Pending Reactivations",
        value: pendingReactivations,
        color: darkAmber,
      },
      { name: "Suspended", value: suspendedWorkers, color: red },
    ].filter((item) => item.value > 0);

    const newEmployerCounts = countByBucket(
      currentEmployers.map((row) => row.created_at),
      periodKeys,
      range,
    );
    const newEmployerTotal = currentEmployers.length;
    let employerTotalAtStart = Math.max(0, totalEmployers - newEmployerTotal);
    const employerGrowth = periodKeys.map((date) => {
      const newEmployers = newEmployerCounts.get(date) ?? 0;
      employerTotalAtStart += newEmployers;
      return {
        date,
        label: bucketLabel(date, range),
        newEmployers,
        totalEmployers: employerTotalAtStart,
      };
    });

    const currentCompletedHandshakes = handshakeRows.filter(
      (row) => row.completed_at && inRange(row.completed_at, start, end),
    );
    const previousCompletedHandshakes = handshakeRows.filter(
      (row) =>
        row.completed_at && inRange(row.completed_at, previousStart, previousEnd),
    );
    const currentConsideration = currentRequests.filter(
      (row) =>
        row.status === "considering" && inRange(row.updated_at, start, end),
    );
    const currentDeclined = currentRequests.filter(
      (row) => row.status === "declined" && inRange(row.updated_at, start, end),
    );
    const completedCounts = countByBucket(
      currentCompletedHandshakes.flatMap((row) =>
        row.completed_at ? [row.completed_at] : [],
      ),
      periodKeys,
      range,
    );
    const considerationCounts = countByBucket(
      currentConsideration.map((row) => row.updated_at),
      periodKeys,
      range,
    );
    const declinedCounts = countByBucket(
      currentDeclined.map((row) => row.updated_at),
      periodKeys,
      range,
    );
    const requestActivity = periodKeys.map((date) => ({
      date,
      label: bucketLabel(date, range),
      completed: completedCounts.get(date) ?? 0,
      consideration: considerationCounts.get(date) ?? 0,
      declined: declinedCounts.get(date) ?? 0,
    }));

    const completedRequestIds = new Set(
      currentCompletedHandshakes
        .map((row) => row.request_id)
        .filter((id): id is string => Boolean(id)),
    );
    const funnelSent = currentRequests.length;
    const funnelConsideration = currentRequests.filter(
      (row) => row.status === "considering",
    ).length;
    const funnelAccepted = currentRequests.filter(
      (row) => row.status === "accepted",
    ).length;
    const funnelCompleted = currentRequests.filter((row) =>
      completedRequestIds.has(row.id),
    ).length;
    const funnelPercent = (count: number) =>
      funnelSent === 0 ? 0 : round((count / funnelSent) * 100);
    const requestFunnel = [
      { label: "Requests Sent", count: funnelSent, percent: 100 },
      {
        label: "In Consideration",
        count: funnelConsideration,
        percent: funnelPercent(funnelConsideration),
      },
      {
        label: "Accepted",
        count: funnelAccepted,
        percent: funnelPercent(funnelAccepted),
      },
      {
        label: "Handshake Completed",
        count: funnelCompleted,
        percent: funnelPercent(funnelCompleted),
      },
    ];

    const requestedWorkerIds = [
      ...new Set(currentRequests.map((row) => row.worker_profile_id)),
    ];
    const requestedWorkerRows = await getRequestedWorkerRows(
      supabase,
      requestedWorkerIds,
    );
    const requestedWorkersById = new Map(
      requestedWorkerRows.map((worker) => [worker.id, worker]),
    );
    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const demandCounts = new Map<string, number>();
    for (const request of currentRequests) {
      const worker = requestedWorkersById.get(request.worker_profile_id);
      for (const categoryId of worker ? specialtyIdsForWorker(worker) : []) {
        demandCounts.set(categoryId, (demandCounts.get(categoryId) ?? 0) + 1);
      }
    }
    const supplyCounts = new Map<string, number>();
    for (const worker of supplyWorkers) {
      for (const categoryId of specialtyIdsForWorker(worker)) {
        supplyCounts.set(categoryId, (supplyCounts.get(categoryId) ?? 0) + 1);
      }
    }
    const specialtyIds = [
      ...new Set([...demandCounts.keys(), ...supplyCounts.keys()]),
    ];
    const demandBySpecialty = specialtyIds
      .map((id) => ({
        specialty: categoryNames.get(id) ?? "Uncategorised",
        requests: demandCounts.get(id) ?? 0,
      }))
      .filter((item) => item.requests > 0)
      .sort((a, b) => b.requests - a.requests || a.specialty.localeCompare(b.specialty))
      .slice(0, 8);
    const supplyVsDemand = specialtyIds
      .map((id) => {
        const availableWorkers = supplyCounts.get(id) ?? 0;
        const employerRequests = demandCounts.get(id) ?? 0;
        return {
          specialty: categoryNames.get(id) ?? "Uncategorised",
          availableWorkers,
          employerRequests,
          difference: availableWorkers - employerRequests,
          ratio: ratioLabel(availableWorkers, employerRequests),
          state: getSupplyDemandState(availableWorkers, employerRequests),
        };
      })
      .sort(
        (a, b) =>
          b.employerRequests - a.employerRequests ||
          a.specialty.localeCompare(b.specialty),
      )
      .slice(0, 10);

    const currentMatchRate =
      funnelSent === 0 ? 0 : (currentCompletedHandshakes.length / funnelSent) * 100;
    const previousSent = previousRequests.length;
    const previousMatchRate =
      previousSent === 0
        ? 0
        : (previousCompletedHandshakes.length / previousSent) * 100;
    const matchSuccessChange = percentageChange(
      currentMatchRate,
      previousMatchRate,
    );
    const requestCreatedAt = new Map(
      requestRows.map((request) => [request.id, request.created_at]),
    );
    const matchDurations = handshakeRows
      .filter((row) => inRange(row.matched_at, start, end))
      .map((row) => {
        const requestCreated = row.request_id
          ? requestCreatedAt.get(row.request_id)
          : null;
        const startTime = requestCreated ? Date.parse(requestCreated) : NaN;
        const endTime = Date.parse(row.matched_at);
        return Number.isFinite(startTime) && endTime >= startTime
          ? (endTime - startTime) / dayInMilliseconds
          : null;
      })
      .filter((value): value is number => value !== null);
    const averageTimeToMatchDays = matchDurations.length
      ? round(
          matchDurations.reduce((total, value) => total + value, 0) /
            matchDurations.length,
        )
      : null;
    const activeEmployerRate =
      totalEmployers === 0 ? 0 : (activeEmployers / totalEmployers) * 100;
    const activeWorkerRate =
      totalWorkers === 0 ? 0 : (activeWorkers / totalWorkers) * 100;
    const healthIndex = Math.round(
      Math.min(
        100,
        currentMatchRate * 0.6 + activeEmployerRate * 0.25 + activeWorkerRate * 0.15,
      ),
    );

    const attention = [];
    const criticalSupply = supplyVsDemand.find(
      (item) => item.state === "critical",
    );
    if (criticalSupply) {
      attention.push({
        severity: "urgent" as const,
        category: "Critical supply shortage",
        message: `${criticalSupply.specialty} has ${criticalSupply.employerRequests} requests and only ${criticalSupply.availableWorkers} available specialists.`,
        count: Math.max(criticalSupply.employerRequests - criticalSupply.availableWorkers, 0),
        href: "/admin/categories",
      });
    }
    if (suspendedWorkers > 0) {
      attention.push({
        severity: "urgent" as const,
        category: "Compliance review",
        message: `${suspendedWorkers} suspended worker account${suspendedWorkers === 1 ? "" : "s"} require${suspendedWorkers === 1 ? "s" : ""} operational review.`,
        count: suspendedWorkers,
        href: "/admin/workers",
      });
    }
    if (pendingApplications > 0) {
      attention.push({
        severity: "attention" as const,
        category: "Credential queue",
        message: `${pendingApplications} worker application${pendingApplications === 1 ? " is" : "s are"} awaiting review.`,
        count: pendingApplications,
        href: "/admin/applications",
      });
    }
    if (pendingReactivations > 0) {
      attention.push({
        severity: "attention" as const,
        category: "Reactivation queue",
        message: `${pendingReactivations} worker reactivation request${pendingReactivations === 1 ? " is" : "s are"} awaiting review.`,
        count: pendingReactivations,
        href: "/admin/applications",
      });
    }
    const staleRequests = currentRequests.filter(
      (request) =>
        (request.status === "pending" || request.status === "considering") &&
        Date.now() - Date.parse(request.created_at) > 48 * 60 * 60 * 1000,
    ).length;
    if (staleRequests > 0) {
      attention.push({
        severity: "attention" as const,
        category: "Stalled request funnel",
        message: `${staleRequests} open request${staleRequests === 1 ? " is" : "s are"} older than 48 hours without a completed handshake.`,
        count: staleRequests,
        href: "/admin/handshakes",
      });
    }
    if (currentMatchRate > 0) {
      attention.push({
        severity: "positive" as const,
        category: "Marketplace health",
        message: `The selected period has a ${round(currentMatchRate)}% request-to-handshake completion rate.`,
        count: round(currentMatchRate),
      });
    }

    const visitorTrendCounts = new Map<string, Set<string>>();
    for (const key of periodKeys) visitorTrendCounts.set(key, new Set());
    for (const row of currentVisitors) {
      const key = bucketKey(row.created_at, range);
      visitorTrendCounts.get(key)?.add(row.visitor_id);
    }

    return {
      range,
      periodLabel: range === 365 ? "Last 12 months" : `Last ${range} days`,
      lastSyncedAt: new Date().toISOString(),
      kpis: {
        visitors: {
          value: currentUniqueVisitors,
          change: percentageChange(currentUniqueVisitors, previousUniqueVisitors),
        },
        activeWorkers: { value: activeWorkers, change: null },
        totalWorkers: {
          value: totalWorkers,
          change: percentageChange(currentWorkers.length, previousWorkers.length),
        },
        totalEmployers: {
          value: totalEmployers,
          change: percentageChange(currentEmployers.length, previousEmployers.length),
        },
        pendingApplications,
        pendingReactivations,
      },
      workerGrowth,
      workerStatus,
      employerGrowth,
      employerSummary: {
        total: totalEmployers,
        active: activeEmployers,
        newEmployers: newEmployerTotal,
      },
      marketplaceHealth: {
        matchSuccessRate: round(currentMatchRate),
        matchSuccessChange:
          matchSuccessChange === null ? null : round(matchSuccessChange),
        averageTimeToMatchDays,
        newEmployers: newEmployerTotal,
        healthIndex,
      },
      requestActivity,
      requestFunnel,
      demandBySpecialty,
      supplyVsDemand,
      attention,
      visitorTrend: periodKeys.map((date) => ({
        date,
        label: bucketLabel(date, range),
        visitors: visitorTrendCounts.get(date)?.size ?? 0,
      })),
    };
  },
);
