import { Skeleton } from "@/components/ui/skeleton";

export function DashboardShellLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-10 w-64 rounded-2xl" />
                    <Skeleton className="h-4 w-72 rounded-full" />
                </div>
                <Skeleton className="h-14 w-full rounded-[1.75rem] md:w-56" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
                        <Skeleton className="h-12 rounded-none" />
                        <div className="space-y-3 p-6">
                            <Skeleton className="h-4 w-28 rounded-full" />
                            <Skeleton className="h-8 w-24 rounded-xl" />
                            <Skeleton className="h-3 w-32 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div className="rounded-[2.5rem] border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40 rounded-full" />
                            <Skeleton className="h-4 w-56 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-32 rounded-full" />
                    </div>
                    <Skeleton className="h-72 w-full rounded-[2rem]" />
                </div>

                <div className="rounded-[2.5rem] border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32 rounded-full" />
                            <Skeleton className="h-4 w-48 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-4 rounded-[1.5rem] border border-zinc-100 p-4">
                                <Skeleton className="h-12 w-12 rounded-2xl" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-40 rounded-full" />
                                    <Skeleton className="h-3 w-28 rounded-full" />
                                </div>
                                <Skeleton className="h-4 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
