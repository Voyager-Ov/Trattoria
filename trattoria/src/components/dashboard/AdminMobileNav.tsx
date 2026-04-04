"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, MoreHorizontal, ChevronRight } from "lucide-react";

import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
    ADMIN_ACCOUNT_ITEMS,
    ADMIN_MOBILE_PRIMARY_ITEMS,
    ADMIN_MOBILE_SECONDARY_ITEMS,
    ADMIN_NAV_ITEMS,
    getAdminPageLabel,
    isAdminItemActive,
    isAdminMoreActive,
    type AdminNavItem,
} from "./adminNavigation";

// Renders a single nav link row (used in both sheet sections)
function SheetNavLink({
    href,
    isActive,
    item,
    subDescription,
    icon: Icon,
    label,
}: {
    href: string;
    isActive: boolean;
    item: AdminNavItem;
    icon: AdminNavItem["icon"];
    label: string;
    subDescription?: string;
}) {
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
                    <p className={cn("truncate text-sm font-semibold tracking-tight", isActive ? "text-zinc-950" : "text-zinc-700")}>
                        {label}
                    </p>
                    <p className="text-xs text-zinc-400">{subDescription ?? "Abrir módulo"}</p>
                </div>
                <ChevronRight className={cn("h-4 w-4", isActive ? item.tone.softText : "text-zinc-400")} />
            </Link>
        </SheetClose>
    );
}

export function AdminMobileNav() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const moreActive = isAdminMoreActive(pathname);
    const currentLabel = getAdminPageLabel(pathname);

    // Find the reportes item to get its subItems
    const reportesItem = ADMIN_NAV_ITEMS.find((item) => item.key === "reportes");
    const isInsideReportes = reportesItem ? isAdminItemActive(pathname, reportesItem) : false;

    // Split secondary items: those with subItems vs plain items
    const plainSecondaryItems = ADMIN_MOBILE_SECONDARY_ITEMS.filter(
        (item) => !ADMIN_ACCOUNT_ITEMS.some((a) => a.href === item.href) && !item.subItems?.length
    );
    const expandableSecondaryItems = ADMIN_MOBILE_SECONDARY_ITEMS.filter(
        (item) => !ADMIN_ACCOUNT_ITEMS.some((a) => a.href === item.href) && !!item.subItems?.length
    );

    return (
        <div className="md:hidden">
            {/* Contextual sub-nav strip for Reportes sub-pages */}
            {isInsideReportes && reportesItem?.subItems && reportesItem.subItems.length > 0 && (
                <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--admin-mobile-nav-offset)+0.5rem)] z-30 px-3">
                    <div className="pointer-events-auto mx-auto max-w-lg">
                        <div className={cn(
                            "flex items-center gap-1.5 rounded-2xl border px-2 py-1.5",
                            "border-rose-200/60 bg-white/95 shadow-[0_8px_24px_rgba(244,63,94,0.10)] backdrop-blur-xl"
                        )}>
                            {reportesItem.subItems.map((sub) => {
                                const SubIcon = sub.icon ?? reportesItem.icon;
                                // Exact match only — avoids "Dashboard" lighting up on /ingresos or /egresos
                                const isSubActive = pathname === sub.href;
                                return (
                                    <Link
                                        key={sub.href}
                                        href={sub.href}
                                        className={cn(
                                            "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold transition-all duration-200",
                                            isSubActive
                                                ? cn("bg-rose-500/10 text-rose-700", "border border-rose-400/20")
                                                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                                        )}
                                    >
                                        <SubIcon className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{sub.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Main bottom navigation bar */}
            <nav
                aria-label="Navegación principal de administrador"
                className="app-mobile-nav pointer-events-none fixed inset-x-0 bottom-0 z-40"
            >
                <div className="pointer-events-auto mx-auto max-w-lg rounded-[1.75rem] border border-zinc-200 bg-white/95 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl app-mobile-nav-panel">
                    <div className="grid grid-cols-5 gap-1.5">
                        {ADMIN_MOBILE_PRIMARY_ITEMS.map((item) => {
                            const isActive = isAdminItemActive(pathname, item);

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
                                    className={cn(
                                        "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.2rem] border px-2 py-2.5 transition-all duration-200",
                                        moreActive
                                            ? "border-zinc-900 bg-zinc-950 text-white shadow-[0_10px_20px_rgba(15,23,42,0.18)]"
                                            : "border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                                    )}
                                    type="button"
                                >
                                    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl">
                                        {(moreActive || ADMIN_ACCOUNT_ITEMS.some((item) => isAdminItemActive(pathname, item))) && (
                                            <span className="absolute -top-1 h-1.5 w-6 rounded-full bg-zinc-500" />
                                        )}
                                        <MoreHorizontal className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="truncate text-[11px] font-semibold tracking-tight">Más</span>
                                </button>
                            </SheetTrigger>

                            <SheetContent
                                side="bottom"
                                className="app-mobile-sheet rounded-t-[1.75rem] border-zinc-200 bg-[#FCFCFB] px-4 pt-4"
                            >
                                <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-zinc-200" />

                                <div className="mb-5 flex items-start justify-between gap-4 pr-8">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Navegación</p>
                                        <SheetTitle className="text-2xl font-black tracking-tight text-zinc-950">Más opciones</SheetTitle>
                                        <p className="text-sm text-zinc-500">Sección actual: {currentLabel}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Plain secondary items (e.g. Menú, Empleados) */}
                                    {plainSecondaryItems.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Gestión</p>
                                            <div className="space-y-2">
                                                {plainSecondaryItems.map((item) => {
                                                    const isActive = isAdminItemActive(pathname, item);
                                                    return (
                                                        <SheetNavLink
                                                            key={item.href}
                                                            href={item.href}
                                                            isActive={isActive}
                                                            item={item}
                                                            icon={item.icon}
                                                            label={item.name}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Expandable items with sub-pages */}
                                    {expandableSecondaryItems.map((item) => {
                                        const isParentActive = isAdminItemActive(pathname, item);
                                        return (
                                            <div key={item.key} className="space-y-2">
                                                {/* Section header */}
                                                <div className="flex items-center gap-2 px-1">
                                                    <div
                                                        className={cn(
                                                            "flex h-6 w-6 items-center justify-center rounded-lg border",
                                                            isParentActive
                                                                ? cn(item.tone.softBg, item.tone.softBorder, item.tone.softText)
                                                                : "border-zinc-200 bg-zinc-100 text-zinc-400"
                                                        )}
                                                    >
                                                        <item.icon className="h-3.5 w-3.5" />
                                                    </div>
                                                    <p
                                                        className={cn(
                                                            "text-[11px] font-black uppercase tracking-[0.18em]",
                                                            isParentActive ? item.tone.softText : "text-zinc-400"
                                                        )}
                                                    >
                                                        {item.name}
                                                    </p>
                                                    {isParentActive && (
                                                        <span
                                                            className={cn(
                                                                "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                                                                item.tone.softBg,
                                                                item.tone.softText
                                                            )}
                                                        >
                                                            Activo
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Sub-pages as direct links */}
                                                <div className="space-y-2">
                                                    {item.subItems?.map((sub) => {
                                                        const isSubActive =
                                                            pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                                                        const SubIcon = sub.icon ?? item.icon;
                                                        return (
                                                            <SheetNavLink
                                                                key={sub.href}
                                                                href={sub.href}
                                                                isActive={isSubActive}
                                                                item={item}
                                                                icon={SubIcon}
                                                                label={sub.name}
                                                                subDescription={sub.description}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Cuenta */}
                                    <div className="space-y-2">
                                        <p className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Cuenta</p>
                                        <div className="space-y-2">
                                            {ADMIN_ACCOUNT_ITEMS.map((item) => {
                                                const isActive = isAdminItemActive(pathname, item);
                                                return (
                                                    <SheetNavLink
                                                        key={item.href}
                                                        href={item.href}
                                                        isActive={isActive}
                                                        item={item}
                                                        icon={item.icon}
                                                        label={item.name}
                                                        subDescription="Administrar cuenta"
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => logout()}
                                        className="h-12 w-full rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                    >
                                        <LogOut className="h-4.5 w-4.5" />
                                        Cerrar Sesión
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
