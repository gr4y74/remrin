import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-rp-surface/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-rp-muted/10 before:to-transparent",
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-rp-surface border-rp-muted/20 rounded-2xl border p-4 shadow-sm", className)}>
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

function SkeletonAvatar({ size = "md", className }: { size?: "sm" | "md" | "lg" | "xl", className?: string }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-11 w-11",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  }

  return (
    <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />
  )
}

function SkeletonButton({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-11 w-24 rounded-md", className)} />
  )
}

function SkeletonText({ lines = 3, className }: { lines?: number, className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
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

function SkeletonCharacterCard() {
  return (
    <div className="bg-rp-surface border-rp-muted/20 overflow-hidden rounded-2xl border">
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonText,
  SkeletonCharacterCard
}

