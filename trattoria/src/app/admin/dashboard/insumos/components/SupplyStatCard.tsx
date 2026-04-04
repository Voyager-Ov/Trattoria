import type React from "react";

interface SupplyStatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    headerClass: string;
    valueClassName?: string;
}

export function SupplyStatCard({ label, value, icon: Icon, headerClass, valueClassName }: SupplyStatCardProps) {
    return (
        <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className={`flex items-center justify-between px-4 py-3 md:px-5 ${headerClass}`}>
                <span className="text-sm font-semibold text-white">{label}</span>
                <Icon className="h-5 w-5 text-white/80" />
            </div>
            <div className="px-4 py-5 md:px-6 md:py-6">
                <span className={`block break-words font-black tracking-tight text-zinc-900 ${valueClassName ?? "text-2xl sm:text-3xl md:text-4xl"}`}>
                    {value}
                </span>
            </div>
        </div>
    );
}
