import Link from "next/link";
import { getAdminMetrics } from "@/lib/domain/beauty-connect";
import { SectionHeading, SetupState } from "@/components/shared/ui";

export default async function AdminDashboardPage() {
  try {
    const metrics = await getAdminMetrics();
    const items = [
      ["Total workers", metrics.workers, "/admin/workers"],
      ["Pending applications", metrics.pending, "/admin/applications"],
      ["Approved and live", metrics.approved, "/admin/workers"],
      ["Active employers", metrics.employers, "/admin/employers"],
      ["Active requests", metrics.requests, "/admin/handshakes"],
      ["Successful handshakes", metrics.handshakes, "/admin/handshakes"],
    ] as const;
    return (
      <div>
        <SectionHeading
          eyebrow="Admin overview"
          title="Keep the marketplace healthy"
          description="Real-time counts from the Beauty Connect database."
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(([label, value, href]) => (
            <Link
              key={label}
              href={href}
              className="border border-border bg-background p-5 hover:border-foreground"
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-4 text-4xl font-semibold">{value}</p>
            </Link>
          ))}
        </div>
        <div className="mt-10 border border-border bg-background p-6">
          <h2 className="text-lg font-semibold">Review queue</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pending applications are the most important next action. Review the
            worker’s information and approve only when it is ready to be
            visible.
          </p>
          <Link
            href="/admin/applications"
            className="mt-5 inline-flex text-sm font-medium underline underline-offset-4"
          >
            Open applications →
          </Link>
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
