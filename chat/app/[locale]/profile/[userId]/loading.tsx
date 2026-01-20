import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="min-h-screen bg-rp-base">
            {/* Banner Skeleton */}
            <Skeleton className="h-48 w-full md:h-64" />

            <div className="container px-4 md:px-6">
                <div className="relative -mt-16 mb-4 flex flex-col items-center md:mb-6 md:flex-row md:items-end md:gap-6">
                    {/* Avatar Skeleton */}
                    <div className="relative">
                        <Skeleton className="h-32 w-32 rounded-full border-4 border-rp-base" />
                    </div>

                    {/* Profile Info Skeleton */}
                    <div className="mt-4 flex flex-1 flex-col items-center gap-2 md:mt-0 md:mb-2 md:items-start">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="mt-2 h-16 w-full max-w-md md:w-[600px]" />
                    </div>

                    {/* Action Button Skeleton */}
                    <Skeleton className="mt-4 h-10 w-32 md:mt-0 md:bg-rp-iris/20" />
                </div>

                {/* Tabs Skeleton */}
                <div className="mb-6 flex gap-2 border-b border-rp-highlight-med pb-1">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>

                {/* Content Grid Skeleton */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Left Column (Stats/About) */}
                    <div className="space-y-6 md:col-span-1">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>

                    {/* Right Column (Content) */}
                    <div className="space-y-6 md:col-span-2">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Skeleton className="h-64 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
