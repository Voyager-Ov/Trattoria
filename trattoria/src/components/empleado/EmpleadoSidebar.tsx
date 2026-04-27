"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeft } from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import { EMPLOYEE_ACCOUNT_ITEMS, EMPLOYEE_NAV_ITEMS, EmployeeNavItem, isEmployeeItemActive } from "./employeeNavigation";

interface EmpleadoSidebarProps {
    className?: string;
}

function getMenuButtonClass(item: EmployeeNavItem, isActive: boolean) {
    return cn(
        "relative h-11 min-w-0 rounded-xl px-2.5 text-sm font-medium text-zinc-600 shadow-none transition-all duration-200 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        !isActive && "hover:bg-zinc-50 hover:text-zinc-950",
        isActive && cn("border shadow-sm", item.tone.softBg, item.tone.softBorder, item.tone.softText)
    );
}

function EmployeeSidebarItem({ item, pathname }: { item: EmployeeNavItem; pathname: string }) {
    const isActive = isEmployeeItemActive(pathname, item);

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.name} className={getMenuButtonClass(item, isActive)}>
                <Link href={item.href}>
                    <span
                        className={cn(
                            "absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full transition-opacity duration-200",
                            "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none",
                            isActive ? item.tone.dot : "opacity-0"
                        )}
                    />
                    <span
                        className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200",
                            isActive ? cn("border-transparent", item.tone.softBg, item.tone.softText) : "border-zinc-200 bg-zinc-50 text-zinc-500"
                        )}
                    >
                        <item.icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.name}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export function EmpleadoSidebar({ className }: EmpleadoSidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const isMobile = useIsMobile();
    const { state, toggleSidebar } = useSidebar();

    if (isMobile) {
        return null;
    }

    const isCollapsed = state === "collapsed";

    return (
        <Sidebar collapsible="icon" variant="inset" className={cn("transition-all duration-300", className)}>
            <SidebarHeader className="border-b border-sidebar-border/70 p-2">
                <div className="flex items-center gap-2 overflow-hidden px-1">
                    <Link
                        href="/empleado"
                        className={cn(
                            "flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-sidebar-border bg-white transition-all duration-300 hover:bg-zinc-50",
                            isCollapsed ? "h-10 justify-center border-0 bg-transparent p-0 shadow-none" : "h-14 px-2.5 shadow-sm"
                        )}
                    >
                        <div
                            className={cn(
                                "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950 transition-all duration-300",
                                isCollapsed ? "h-8 w-8" : "h-9 w-9"
                            )}
                        >
                            <Image src="/tratologo.png" alt="Trattoria" fill className="object-cover" />
                        </div>

                        {!isCollapsed && (
                            <div className="min-w-0 flex-1 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-left-2">
                                <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">Empleado</p>
                                <p className="truncate text-sm font-bold tracking-tight text-zinc-950">Trattoria</p>
                            </div>
                        )}
                    </Link>
                </div>
            </SidebarHeader>

            <SidebarContent className="gap-0 px-2 py-3">
                <SidebarGroup className="p-0">
                    <div
                        className={cn(
                            "px-2 pb-1 text-[11px] font-black uppercase tracking-[0.18em] transition-all duration-300",
                            isCollapsed ? "opacity-0 select-none" : "text-zinc-400"
                        )}
                        style={{ height: "1.75rem" }}
                        aria-hidden={isCollapsed}
                    >
                        Operación
                    </div>

                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={toggleSidebar}
                                    tooltip={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                                    className="relative h-11 min-w-0 rounded-xl border border-zinc-200 bg-white px-2.5 text-sm font-medium text-zinc-600 shadow-sm transition-all duration-200 hover:bg-zinc-50 hover:text-zinc-950 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500">
                                        <PanelLeft className="h-4.5 w-4.5" />
                                    </span>
                                    <span className="truncate group-data-[collapsible=icon]:hidden">{isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {EMPLOYEE_NAV_ITEMS.map((item) => (
                                <EmployeeSidebarItem key={item.key} item={item} pathname={pathname} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="gap-0 border-t border-sidebar-border/70 px-2 py-3">
                <SidebarGroup className="p-0">
                    <div
                        className={cn(
                            "px-2 pb-1 text-[11px] font-black uppercase tracking-[0.18em] transition-all duration-300",
                            isCollapsed ? "opacity-0 select-none" : "text-zinc-400"
                        )}
                        style={{ height: "1.75rem" }}
                        aria-hidden={isCollapsed}
                    >
                        Cuenta
                    </div>

                    <SidebarGroupContent>
                        <SidebarMenu>
                            {EMPLOYEE_ACCOUNT_ITEMS.map((item) => (
                                <EmployeeSidebarItem key={item.key} item={item} pathname={pathname} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-2" />

                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => logout()}
                            tooltip="Cerrar sesión"
                            className="h-11 min-w-0 rounded-xl border border-red-100 bg-red-50 px-2.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-100 hover:text-red-700 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600">
                                <LogOut className="h-4.5 w-4.5" />
                            </span>
                            <span className="truncate group-data-[collapsible=icon]:hidden">Cerrar sesión</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
