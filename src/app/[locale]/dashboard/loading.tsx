import { Skeleton } from "@/components/ui/skeleton";

/**
 * Scoped to the dashboard subtree only. A loading boundary at the locale root
 * would stream the shell before `notFound()` could set a 404 status.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
