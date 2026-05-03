import React from "react";

import { cn } from "@/lib/utils";

interface DashboardMetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    headerColor: string;
    icon?: React.ReactNode;
    tone?: "default" | "alert";
}

export function DashboardMetricCard({
    title,
    value,
    description,
    headerColor,
    icon,
    tone = "default",
}: DashboardMetricCardProps) {
    return (
        <div
            className={cn(
                "flex h-full min-h-[156px] flex-col overflow-hidden rounded-[1.75rem] border bg-white shadow-sm transition-shadow duration-300 hover:shadow-md md:min-h-[176px] md:rounded-[2rem]",
                tone === "alert" ? "border-rose-200 shadow-rose-100/60" : "border-zinc-200"
            )}
        >
            <div className={`flex h-11 items-center px-4 text-sm font-medium text-white md:h-12 md:px-6 ${headerColor}`}>
                {title}
                {icon ? <div className="ml-auto opacity-80">{icon}</div> : null}
            </div>

            <div className="flex flex-grow flex-col justify-between gap-4 p-4 md:p-6">
                <span className="text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">{value}</span>

                {description ? (
                    <p
                        className={cn(
                            "mt-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] leading-relaxed md:mt-2 md:text-[0.75rem]",
                            tone === "alert" ? "text-rose-500" : "text-zinc-500"
                        )}
                    >
                        {description}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
