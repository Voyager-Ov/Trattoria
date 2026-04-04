"use client";

import type React from "react";

import { cn } from "@/lib/utils";

export function ReportSurface({
    title,
    description,
    action,
    children,
    className,
    titleClassName,
    descriptionClassName,
    headerClassName,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    titleClassName?: string;
    descriptionClassName?: string;
    headerClassName?: string;
}) {
    return (
        <section className={cn("rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6", className)}>
            <div className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", headerClassName)}>
                <div>
                    <h3 className={cn("text-lg font-black tracking-tight text-zinc-900", titleClassName)}>{title}</h3>
                    {description ? <p className={cn("text-sm text-zinc-500", descriptionClassName)}>{description}</p> : null}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

export function ReportLegendList({
    items,
    className,
}: {
    items: Array<{ label: string; value: string; meta?: string; color: string }>;
    className?: string;
}) {
    return (
        <div className={cn("space-y-2", className)}>
            {items.map((item) => (
                <div key={`${item.label}-${item.value}`} className="flex items-start justify-between gap-3 rounded-[1.25rem] bg-zinc-50 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-800">{item.label}</p>
                            {item.meta ? <p className="text-xs text-zinc-400">{item.meta}</p> : null}
                        </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-zinc-900">{item.value}</span>
                </div>
            ))}
        </div>
    );
}

export function truncateLabel(value: string, maxLength = 12) {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, Math.max(3, maxLength - 3))}...`;
}
