"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, MoreHorizontal } from "lucide-react";

import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
    EMPLOYEE_ACCOUNT_ITEMS,
    EMPLOYEE_MOBILE_PRIMARY_ITEMS,
    EMPLOYEE_MOBILE_SECONDARY_ITEMS,
    EmployeeNavItem,
    getEmployeePageLabel,
    isEmployeeItemActive,
    isEmployeeMoreActive,
} from "./employeeNavigation";

function EmployeeSheetNavLink({
    href,
    isActive,
    item,
    label,
    subDescription,
}: {
    href: string;
    isActive: boolean;
    item: EmployeeNavItem;
    label: string;
    subDescription?: string;
}) {
    const Icon = item.icon;

    return (
        <SheetClose asChild>
            <Link
                href={href}
                className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200",
                    isActive
                        ? cn("bg-white shadow-[0_10px_24px_rgba(15,23,42,0.07)]", item.tone.softBg, item.tone.softBorder)
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                )}
            >
                <div
                    className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                        isActive
                            ? cn(item.tone.softBg, item.tone.softBorder, item.tone.softText)
                            : "border-zinc-200 bg-zinc-100 text-zinc-500"
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-semibold tracking-tight", isActive ? "text-zinc-950" : "text-zinc-700")}>{label}</p>
                    <p className="text-xs text-zinc-400">{subDescription ?? "Abrir módulo"}</p>
                </div>
                <ChevronRight className={cn("h-4 w-4", isActive ? item.tone.softText : "text-zinc-400")} />
            </Link>
        </SheetClose>
    );
}

export function EmployeeMobileNav() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const moreActive = isEmployeeMoreActive(pathname);
    const currentLabel = getEmployeePageLabel(pathname);

    return (
        <div className="md:hidden">
            <nav aria-label="Navegación principal de empleado" className="app-mobile-nav pointer-events-none fixed inset-x-0 bottom-0 z-40">
                <div className="pointer-events-auto mx-auto max-w-lg rounded-[1.75rem] border border-zinc-200 bg-white/95 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl app-mobile-nav-panel">
                    <div className="grid grid-cols-5 gap-1.5">
                        {EMPLOYEE_MOBILE_PRIMARY_ITEMS.map((item) => {
                            const isActive = isEmployeeItemActive(pathname, item);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.2rem] border px-2 py-2.5 transition-all duration-200",
                                        isActive
                                            ? "border-zinc-900 bg-zinc-950 text-white shadow-[0_10px_20px_rgba(15,23,42,0.18)]"
                                            : "border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                                    )}
                                >
                                    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl">
                                        {isActive && <span className={cn("absolute -top-1 h-1.5 w-6 rounded-full", item.tone.dot)} />}
                                        <item.icon className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="truncate text-[11px] font-semibold tracking-tight">{item.shortName}</span>
                                </Link>
                            );
                        })}

                        <Sheet>
                            <SheetTrigger asChild>
                                <button
                                    type="button"
                                    className={cn(
                                        "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.2rem] border px-2 py-2.5 transition-all duration-200",
                                        moreActive
                                            ? "border-zinc-900 bg-zinc-950 text-white shadow-[0_10px_20px_rgba(15,23,42,0.18)]"
                                            : "border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                                    )}
                                >
                                    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl">
                                        {(moreActive || EMPLOYEE_ACCOUNT_ITEMS.some((item) => isEmployeeItemActive(pathname, item))) && (
                                            <span className="absolute -top-1 h-1.5 w-6 rounded-full bg-zinc-500" />
                                        )}
                                        <MoreHorizontal className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="truncate text-[11px] font-semibold tracking-tight">Más</span>
                                </button>
                            </SheetTrigger>

                            <SheetContent side="bottom" className="app-mobile-sheet rounded-t-[1.75rem] border-zinc-200 bg-[#FCFCFB] px-4 pt-4">
                                <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-zinc-200" />

                                <div className="mb-5 flex items-start justify-between gap-4 pr-8">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Navegación</p>
                                        <SheetTitle className="text-2xl font-black tracking-tight text-zinc-950">Más opciones</SheetTitle>
                                        <p className="text-sm text-zinc-500">Sección actual: {currentLabel}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <p className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Operación</p>
                                        <div className="space-y-2">
                                            {EMPLOYEE_MOBILE_SECONDARY_ITEMS.map((item) => (
                                                <EmployeeSheetNavLink
                                                    key={`${item.key}-${item.href}`}
                                                    href={item.href}
                                                    isActive={isEmployeeItemActive(pathname, item)}
                                                    item={item}
                                                    label={item.name}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => logout()}
                                        className="h-12 w-full rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                    >
                                        <LogOut className="h-4.5 w-4.5" />
                                        Cerrar sesión
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </nav>
        </div>
    );
}
