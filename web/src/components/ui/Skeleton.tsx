import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('rounded-2xl animate-shimmer', className)}
      style={{ background: 'var(--surface-raised)' }}
      aria-hidden="true"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-52 md:row-span-2" />
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
      {/* Chart skeleton */}
      <Skeleton className="h-[420px]" />
    </div>
  );
}
