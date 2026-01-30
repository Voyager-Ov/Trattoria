"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    UtensilsCrossed,
    Settings,
    Menu,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Package,
    FileText
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Menu Items Configuration
const MENU_ITEMS = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Pedidos", href: "/admin/dashboard/pedidos", icon: ShoppingBag },
    { name: "Menú y Productos", href: "/admin/dashboard/productos", icon: UtensilsCrossed },
    { name: "Insumos", href: "/admin/dashboard/insumos", icon: Package },
    { name: "Usuarios", href: "/admin/dashboard/usuarios", icon: Users },
    { name: "Reportes", href: "/admin/dashboard/reportes", icon: FileText },
];

interface SidebarProps {
    className?: string;
    mode?: 'desktop' | 'mobile'; // Support for mobile sheet usage
}

export function Sidebar({ className, mode = 'desktop' }: SidebarProps) {
    const pathname = usePathname();
    // If mobile, always expanded. If desktop, default collapsed.
    const [isCollapsed, setIsCollapsed] = useState(mode === 'desktop');

    const toggleSidebar = () => {
        if (mode === 'mobile') return;
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div
            className={cn(
                "relative flex flex-col h-screen bg-white text-zinc-600 border-r border-zinc-100 transition-all duration-300 ease-in-out shadow-sm",
                // Width logic: Mobile = w-full (handled by container), Desktop = variable
                mode === 'desktop' ? (isCollapsed ? "w-[80px]" : "w-[240px]") : "w-full",
                className
            )}
        >
            {/* Toggle Button - Only for Desktop */}
            {mode === 'desktop' && (
                <Button
                    onClick={toggleSidebar}
                    variant="ghost"
                    size="icon"
                    className="absolute -right-3 top-6 h-6 w-6 rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 z-50 hidden md:flex shadow-sm"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </Button>
            )}

            {/* Header / Logo */}
            <div className={cn(
                "flex items-center h-20 px-4 mb-2 transition-all duration-300",
                (isCollapsed && mode === 'desktop') ? "justify-center" : "justify-start gap-3"
            )}>
                {/* Placeholder Logo */}
                <div className="h-10 w-10 flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                    T
                </div>
                {(!isCollapsed || mode === 'mobile') && (
                    <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 text-lg tracking-tight">Trattoria</span>
                        <span className="text-xs text-zinc-400 font-medium">Panel Administrativo</span>
                    </div>
                )}
            </div>

            {/* Navigation Links */}
            <div className="flex-1 px-3 space-y-2 overflow-y-auto scrollbar-hide py-2">
                <TooltipProvider delayDuration={0}>
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        const showLabel = !isCollapsed || mode === 'mobile';

                        return (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 group active:scale-95",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "hover:bg-zinc-50 hover:text-zinc-900"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "h-5 w-5 flex-shrink-0 transition-colors",
                                                isActive ? "text-primary-foreground" : "text-zinc-400 group-hover:text-zinc-900"
                                            )}
                                        />

                                        {showLabel && (
                                            <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                                {item.name}
                                            </span>
                                        )}

                                        {/* Active Indicator Dot for Collapsed Mode Desktop Only */}
                                        {!showLabel && isActive && (
                                            <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                {/* Only show tooltip if collapsed and desktop */}
                                {!showLabel && (
                                    <TooltipContent side="right" className="bg-white text-zinc-900 border-zinc-200 shadow-md rounded-xl font-medium">
                                        {item.name}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </div>

            {/* Bottom Section: Config & User */}
            <div className="p-3 mt-auto space-y-1">

                <TooltipProvider delayDuration={0}>
                    {/* Settings Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/admin/dashboard/configuracion"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-zinc-50 transition-all duration-200 text-zinc-400 hover:text-zinc-900",
                                    pathname === '/admin/dashboard/configuracion' && "bg-zinc-100 text-zinc-900"
                                )}
                            >
                                <Settings className="h-5 w-5 flex-shrink-0" />
                                {(!isCollapsed || mode === 'mobile') && <span className="font-medium text-sm">Configuración</span>}
                            </Link>
                        </TooltipTrigger>
                        {isCollapsed && mode === 'desktop' &&
                            <TooltipContent side="right" className="bg-white text-zinc-900 border-zinc-200 shadow-md rounded-xl font-medium">
                                Configuración
                            </TooltipContent>
                        }
                    </Tooltip>

                    {/* Logout / User Profile */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-red-50 hover:text-red-500 text-zinc-400 transition-all duration-200 group"
                            >
                                <LogOut className="h-5 w-5 flex-shrink-0" />
                                {(!isCollapsed || mode === 'mobile') && <span className="font-medium text-sm">Cerrar Sesión</span>}
                            </button>
                        </TooltipTrigger>
                        {isCollapsed && mode === 'desktop' &&
                            <TooltipContent side="right" className="bg-white text-red-500 border-red-100 shadow-md rounded-xl font-medium">
                                Cerrar Sesión
                            </TooltipContent>
                        }
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}
