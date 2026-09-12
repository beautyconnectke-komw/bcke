function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

export default function AdminLoading() {
  return (
    <div className="grid gap-5" aria-label="Loading admin page">
      <div className="grid gap-3 border-b border-border pb-6">
        <LoadingBlock className="h-3 w-24" />
        <LoadingBlock className="h-10 w-64" />
        <LoadingBlock className="h-4 w-full max-w-xl" />
      </div>
      <LoadingBlock className="h-12 w-full" />
      <div className="grid gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="animate-pulse border border-border bg-background p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid flex-1 gap-3">
                <LoadingBlock className="h-5 max-w-xs" />
                <LoadingBlock className="h-3 max-w-sm" />
              </div>
              <LoadingBlock className="h-6 w-24 rounded-full" />
            </div>
            <LoadingBlock className="mt-5 h-10 w-32 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
