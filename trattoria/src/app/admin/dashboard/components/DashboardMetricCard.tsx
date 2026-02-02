import React from "react";

interface DashboardMetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    description?: string;
    headerColor: string;
    icon?: React.ReactNode;
    isPrimary?: boolean;
}

export function DashboardMetricCard({
    title,
    value,
    change,
    description,
    headerColor,
    icon,
    isPrimary = false
}: DashboardMetricCardProps) {
    if (isPrimary) {
        return (
            <div className="bg-zinc-900 rounded-[2rem] border-none shadow-xl shadow-zinc-200 overflow-hidden flex flex-col h-full group hover:bg-zinc-800 transition-all duration-300">
                <div className="h-12 bg-white/10 flex items-center px-6 text-white/80 font-medium text-sm">
                    {title}
                    {icon && <div className="ml-auto text-white/60">{icon}</div>}
                </div>
                <div className="p-6 flex flex-col justify-between flex-grow">
                    <div className="flex flex-col gap-1">
                        <span className="text-4xl font-bold text-white tracking-tight">{value}</span>
                        {description && (
                            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                                {description}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow duration-300">
            <div className={`h-12 ${headerColor} flex items-center px-6 text-white font-medium text-sm`}>
                {title}
                {icon && <div className="ml-auto opacity-80">{icon}</div>}
            </div>
            <div className="p-6 flex flex-col justify-between flex-grow">
                <div className="flex items-end gap-3 flex-wrap">
                    <span className="text-3xl font-bold text-zinc-900 tracking-tight">{value}</span>
                    {change && (
                        <span className={`mb-1 px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider ${change.startsWith('-') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                            {change.startsWith('-') ? '' : '+'}{change}% vs ayer
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-zinc-400 text-[0.7rem] font-medium uppercase tracking-widest mt-2">{description}</p>
                )}
            </div>
        </div>
    );
}
