import { Skeleton } from "@/components/ui/skeleton";

export function MenuSkeleton() {
    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Mobile Header Skeleton */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="flex-1 max-w-[200px] h-9 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>

                {/* Categories Scroll Skeleton */}
                <div className="max-w-md mx-auto overflow-x-auto pb-3 px-4 flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
                    ))}
                </div>
            </header>

            {/* Main Content Skeleton */}
            <main className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Banner Skeleton */}
                <Skeleton className="h-48 w-full rounded-[2rem]" />

                {/* Section Title Skeleton */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-6 w-20 rounded-lg" />
                </div>

                {/* Products Grid Skeleton */}
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-card rounded-[1.5rem] p-3 flex gap-4 border border-border/60"
                        >
                            <Skeleton className="h-28 w-28 rounded-2xl shrink-0" />
                            <div className="flex flex-col flex-1 justify-between py-1">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                                <div className="flex items-end justify-between mt-2">
                                    <Skeleton className="h-7 w-20" />
                                    <Skeleton className="h-9 w-9 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
