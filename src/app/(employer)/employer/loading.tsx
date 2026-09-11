function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export default function EmployerLoading() {
  return (
    <div
      aria-label="Loading employer page"
      className="mx-auto max-w-6xl"
      role="status"
    >
      <LoadingBlock className="h-3 w-28" />
      <LoadingBlock className="mt-4 h-10 w-64 max-w-full" />
      <LoadingBlock className="mt-3 h-5 w-full max-w-xl" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <LoadingBlock className="h-36" />
        <LoadingBlock className="h-36" />
        <LoadingBlock className="h-36" />
      </div>
    </div>
  );
}
