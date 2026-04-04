import React from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { formatCurrency } from "@/lib/utils";

interface DashboardMetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    description?: string;
    headerColor: string;
    icon?: React.ReactNode;
    isPrimary?: boolean;
    monthlyGoal?: {
        amount: number;
        currentAmount: number;
        progress: number;
        type: string;
    };
}

export function DashboardMetricCard({
    title,
    value,
    change,
    description,
    headerColor,
    icon,
    monthlyGoal,
    isPrimary = false,
}: DashboardMetricCardProps) {
    if (isPrimary) {
        if (monthlyGoal) {
            return (
                <div className="relative flex h-full min-h-[176px] flex-col overflow-hidden rounded-[1.75rem] border-none bg-zinc-900 shadow-sm transition-all duration-300 hover:bg-zinc-800 md:min-h-[208px] md:rounded-[2rem] md:shadow-xl md:shadow-zinc-200">
                    <div className="relative z-10 flex h-11 items-center px-4 text-sm font-medium text-white/80 md:h-12 md:px-6">
                        {title}
                        {icon ? (
                            <div className="ml-auto flex items-center gap-2.5 text-white/60 md:gap-3">
                                {icon}
                                <Link href="/admin/dashboard/configuracion?tab=goals" className="transition-colors hover:text-white">
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="ml-auto">
                                <Link href="/admin/dashboard/configuracion?tab=goals" className="text-white/60 transition-colors hover:text-white">
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 flex flex-grow flex-col justify-between space-y-4 p-4 md:p-6">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex flex-wrap items-end gap-2">
                                <span className="text-3xl font-bold tracking-tight text-white md:text-4xl">{monthlyGoal.progress}%</span>
                                <span className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-white/40 md:text-sm">
                                    {monthlyGoal.type === "revenue" ? "Ingresos" : "Ganancia"}
                                </span>
                            </div>

                            <span className="text-sm font-bold tracking-wide text-emerald-400">
                                {formatCurrency(monthlyGoal.currentAmount)}
                                <span className="ml-1 truncate font-medium text-white/30">/ {formatCurrency(monthlyGoal.amount)}</span>
                            </span>
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10 md:h-3">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                                style={{ width: `${monthlyGoal.progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex h-full min-h-[176px] flex-col overflow-hidden rounded-[1.75rem] border-none bg-zinc-900 shadow-sm transition-all duration-300 hover:bg-zinc-800 md:rounded-[2rem] md:shadow-xl md:shadow-zinc-200">
                <div className="flex h-11 items-center px-4 text-sm font-medium text-white/80 md:h-12 md:px-6">
                    {title}
                    {icon && <div className="ml-auto text-white/60">{icon}</div>}
                </div>

                <div className="flex flex-grow flex-col justify-between p-4 md:p-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-3xl font-bold tracking-tight text-white md:text-4xl">{value}</span>
                        {description && (
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
                                {description}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-[156px] flex-col overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md md:min-h-[176px] md:rounded-[2rem]">
            <div className={`flex h-11 items-center px-4 text-sm font-medium text-white md:h-12 md:px-6 ${headerColor}`}>
                {title}
                {icon && <div className="ml-auto opacity-80">{icon}</div>}
            </div>

            <div className="flex flex-grow flex-col justify-between gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-end gap-2.5 md:gap-3">
                    <span className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">{value}</span>
                    {change && (
                        <span
                            className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] md:mb-1 md:px-3 ${
                                change.startsWith("-") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                            }`}
                        >
                            {change.startsWith("-") ? "" : "+"}
                            {change}% vs ayer
                        </span>
                    )}
                </div>

                {description && (
                    <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-zinc-400 md:mt-2 md:text-[0.7rem]">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
