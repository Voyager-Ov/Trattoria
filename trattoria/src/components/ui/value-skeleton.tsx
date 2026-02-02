import { cn } from "@/lib/utils";

interface ValueSkeletonProps {
    className?: string;
}

export function ValueSkeleton({ className }: ValueSkeletonProps) {
    return (
        <span className={cn("inline-flex animate-pulse tracking-widest text-zinc-300 font-bold", className)}>
            ...
        </span>
    );
}
