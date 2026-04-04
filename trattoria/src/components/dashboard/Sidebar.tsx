"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, LogOut, PanelLeft } from "lucide-react"
import { useState } from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/lib/hooks/useAuth"
import { cn } from "@/lib/utils"
import { ADMIN_ACCOUNT_ITEMS, ADMIN_NAV_ITEMS, type AdminNavItem, isAdminItemActive } from "./adminNavigation"

interface SidebarProps {
    className?: string
}

function getMenuButtonClass(item: AdminNavItem, isActive: boolean) {
    return cn(
        "relative h-11 min-w-0 rounded-xl px-2.5 text-sm font-medium text-zinc-600 shadow-none transition-all duration-200 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        !isActive && "hover:bg-zinc-50 hover:text-zinc-950",
        isActive && cn("border shadow-sm", item.tone.softBg, item.tone.softBorder, item.tone.softText)
    )
}

function AdminSidebarItem({ item, pathname }: { item: AdminNavItem; pathname: string }) {
    const isActive = isAdminItemActive(pathname, item)

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.name} className={getMenuButtonClass(item, isActive)}>
                <Link href={item.href}>
                    {/* Active indicator dot — hides in icon mode */}
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
    )
}

export function AdminSidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const { logout } = useAuth()
    const isMobile = useIsMobile()
    const { state, toggleSidebar } = useSidebar()
    const [manualExpandedKey, setManualExpandedKey] = useState<string | null>(null)

    if (isMobile) {
        return null
    }

    const isCollapsed = state === "collapsed"

    return (
        <Sidebar collapsible="icon" variant="inset" className={cn("transition-all duration-300", className)}>
            {/* ─── HEADER ─── */}
            <SidebarHeader className="border-b border-sidebar-border/70 p-2">
                <div className="flex items-center gap-2 overflow-hidden px-1">
                    <Link
                        href="/admin/dashboard"
                        className={cn(
                            "flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-sidebar-border bg-white transition-all duration-300 hover:bg-zinc-50",
                            isCollapsed ? "h-10 justify-center border-0 bg-transparent p-0 shadow-none" : "h-14 px-2.5 shadow-sm"
                        )}
                    >
                        {/* Logo icon — always visible */}
                        <div className={cn(
                            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950 transition-all duration-300",
                            isCollapsed ? "h-8 w-8" : "h-9 w-9"
                        )}>
                            <Image src="/tratologo.png" alt="Trattoria" fill className="object-cover" />
                        </div>

                        {/* Text — fades + collapses out, never jumps */}
                        {!isCollapsed && (
                            <div className="min-w-0 flex-1 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-left-2">
                                <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">Admin</p>
                                <p className="truncate text-sm font-bold tracking-tight text-zinc-950">Trattoria</p>
                            </div>
                        )}
                    </Link>
                </div>
            </SidebarHeader>

            {/* ─── CONTENT ─── */}
            <SidebarContent className="gap-0 px-2 py-3">
                <SidebarGroup className="p-0">
                    {/*
                        Group label: always occupies height so icons never jump.
                        In icon mode it's invisible but still occupies space.
                    */}
                    <div
                        className={cn(
                            "px-2 pb-1 text-[11px] font-black uppercase tracking-[0.18em] transition-all duration-300",
                            isCollapsed ? "opacity-0 select-none" : "text-zinc-400"
                        )}
                        style={{ height: "1.75rem" }}
                        aria-hidden={isCollapsed}
                    >
                        Principal
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

                            {ADMIN_NAV_ITEMS.map((item) => {
                                if (!item.subItems?.length) {
                                    return <AdminSidebarItem key={item.key} item={item} pathname={pathname} />
                                }

                                const isActive = isAdminItemActive(pathname, item)
                                const isOpen = isActive || manualExpandedKey === item.key

                                return (
                                    <Collapsible
                                        key={item.key}
                                        open={isOpen && !isCollapsed}
                                        onOpenChange={(open) => {
                                            setManualExpandedKey(open ? item.key : null)
                                        }}
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                tooltip={item.name}
                                                className={getMenuButtonClass(item, isActive)}
                                            >
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
                                                            isActive
                                                                ? cn("border-transparent", item.tone.softBg, item.tone.softText)
                                                                : "border-zinc-200 bg-zinc-50 text-zinc-500"
                                                        )}
                                                    >
                                                        <item.icon className="h-4.5 w-4.5" />
                                                    </span>
                                                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.name}</span>
                                                </Link>
                                            </SidebarMenuButton>

                                            {/* Collapse toggle — auto-hidden by shadcn in icon mode */}
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuAction
                                                    className={cn("top-2 transition-colors duration-200", isActive && item.tone.softText)}
                                                >
                                                    <ChevronRight
                                                        className={cn(
                                                            "h-4 w-4 transition-transform duration-300",
                                                            isOpen && !isCollapsed && "rotate-90"
                                                        )}
                                                    />
                                                    <span className="sr-only">Expandir {item.name}</span>
                                                </SidebarMenuAction>
                                            </CollapsibleTrigger>

                                            <CollapsibleContent className="overflow-hidden transition-all duration-300">
                                                <SidebarMenuSub>
                                                    {item.subItems.map((subItem) => {
                                                        const isSubActive =
                                                            pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
                                                        const SubIcon = subItem.icon

                                                        return (
                                                            <SidebarMenuSubItem key={subItem.href}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isSubActive}
                                                                    className={cn(
                                                                        "rounded-lg px-2 text-zinc-500 transition-colors duration-200",
                                                                        isSubActive && cn("font-medium", item.tone.softBg, item.tone.softText)
                                                                    )}
                                                                >
                                                                    <Link href={subItem.href} className="flex items-center gap-2">
                                                                        <div className="hidden items-center gap-3 md:flex">
                                                                        </div>
                                                                        {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                                                                        {subItem.name}
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        )
                                                    })}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* ─── FOOTER ─── */}
            <SidebarFooter className="gap-0 border-t border-sidebar-border/70 px-2 py-3">
                <SidebarGroup className="p-0">
                    {/* Same fixed-height label trick */}
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
                            {ADMIN_ACCOUNT_ITEMS.map((item) => (
                                <AdminSidebarItem key={item.key} item={item} pathname={pathname} />
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
    )
}
