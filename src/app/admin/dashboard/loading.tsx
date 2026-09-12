export default function AdminDashboardLoading() {
  return (
    <div className="grid gap-5" aria-label="Loading admin dashboard">
      <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-80 animate-pulse rounded-2xl bg-muted lg:col-span-7" />
        <div className="h-80 animate-pulse rounded-2xl bg-muted lg:col-span-5" />
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
