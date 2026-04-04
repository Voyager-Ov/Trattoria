import { Skeleton } from "@/components/ui/skeleton";

export function ReportesLoadingState() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28 rounded-full" />
                    <Skeleton className="h-10 w-72 rounded-2xl" />
                    <Skeleton className="h-4 w-64 rounded-full" />
                </div>
                <Skeleton className="h-11 w-full rounded-full md:w-52" />
            </div>

            <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-2 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton key={index} className="h-10 w-28 rounded-xl" />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
                        <Skeleton className="h-12 rounded-none" />
                        <div className="space-y-3 p-6">
                            <Skeleton className="h-4 w-28 rounded-full" />
                            <Skeleton className="h-8 w-32 rounded-xl" />
                            <Skeleton className="h-3 w-24 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Skeleton className="h-80 rounded-[2rem]" />
                <Skeleton className="h-80 rounded-[2rem]" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Skeleton className="h-64 rounded-[2rem]" />
                <Skeleton className="h-64 rounded-[2rem]" />
            </div>
        </div>
    );
}
