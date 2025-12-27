import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-rp-surface/50", className)}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}

// Preset skeleton components for common use cases
function SkeletonCard() {
  return (
    <div className="bg-rp-surface border-rp-muted/20 rounded-2xl border p-4">
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
    </div>
  )
}

function SkeletonCharacterCard() {
  return (
    <div className="bg-rp-surface border-rp-muted/20 overflow-hidden rounded-2xl border">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/2" />
      </div>
    </div>
  )
}

function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonCharacterCard, SkeletonText }

