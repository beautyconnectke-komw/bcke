export type DashboardRange = 7 | 30 | 90 | 365;

export type DashboardMetric = {
  value: number;
  change: number | null;
};

export type WorkerGrowthPoint = {
  date: string;
  label: string;
  newSignups: number;
  approved: number;
  reactivations: number;
};

export type WorkerStatusPoint = {
  name: string;
  value: number;
  color: string;
};

export type EmployerGrowthPoint = {
  date: string;
  label: string;
  newEmployers: number;
  totalEmployers: number;
};

export type RequestActivityPoint = {
  date: string;
  label: string;
  completed: number;
  consideration: number;
  declined: number;
};

export type VisitorTrendPoint = {
  date: string;
  label: string;
  visitors: number;
};

export type FunnelStage = {
  label: string;
  count: number;
  percent: number;
};

export type DemandPoint = {
  specialty: string;
  requests: number;
};

export type SupplyDemandPoint = {
  specialty: string;
  availableWorkers: number;
  employerRequests: number;
  difference: number;
  ratio: string;
  state: "critical" | "deficit" | "balanced" | "surplus";
};

export type AttentionItem = {
  severity: "urgent" | "attention" | "positive";
  category: string;
  message: string;
  count?: number;
  href?: string;
};

export type AdminDashboardData = {
  range: DashboardRange;
  periodLabel: string;
  lastSyncedAt: string;
  kpis: {
    visitors: DashboardMetric;
    activeWorkers: DashboardMetric;
    totalWorkers: DashboardMetric;
    totalEmployers: DashboardMetric;
    pendingApplications: number;
    pendingReactivations: number;
  };
  workerGrowth: WorkerGrowthPoint[];
  visitorTrend: VisitorTrendPoint[];
  workerStatus: WorkerStatusPoint[];
  employerGrowth: EmployerGrowthPoint[];
  employerSummary: {
    total: number;
    active: number;
    newEmployers: number;
  };
  marketplaceHealth: {
    matchSuccessRate: number;
    matchSuccessChange: number | null;
    averageTimeToMatchDays: number | null;
    newEmployers: number;
    healthIndex: number;
  };
  requestActivity: RequestActivityPoint[];
  requestFunnel: FunnelStage[];
  demandBySpecialty: DemandPoint[];
  supplyVsDemand: SupplyDemandPoint[];
  attention: AttentionItem[];
};
