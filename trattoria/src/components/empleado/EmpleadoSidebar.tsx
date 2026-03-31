"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    Package,
    LogOut,
    ChevronLeft,
    ChevronRight,
    UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/lib/hooks/useAuth";

// Menu Items for Employees
type MenuItem = {
    name: string;
    href: string;
    icon: LucideIcon;
};

const MENU_ITEMS: MenuItem[] = [
    { name: "Dashboard", href: "/empleado", icon: LayoutDashboard },
    { name: "Pedidos", href: "/empleado/pedidos", icon: ShoppingBag },
    { name: "Insumos", href: "/empleado/insumos", icon: Package },
    { name: "Menú y Productos", href: "/empleado/productos", icon: UtensilsCrossed },
];

interface EmpleadoSidebarProps {
    className?: string;
    mode?: 'desktop' | 'mobile';
}

export function EmpleadoSidebar({ className, mode = 'desktop' }: EmpleadoSidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(mode === 'desktop');

    const toggleSidebar = () => {
        if (mode === 'mobile') return;
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div
            className={cn(
                "relative flex flex-col h-screen bg-white text-zinc-600 border-r border-zinc-100 transition-all duration-300 ease-in-out shadow-sm",
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
                <div className="h-10 w-10 flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                    T
                </div>
                {(!isCollapsed || mode === 'mobile') && (
                    <div className="flex flex-col text-left">
                        <span className="font-bold text-zinc-900 text-lg tracking-tight">Trattoria</span>
                        <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">Portal de Empleado</span>
                    </div>
                )}
            </div>

            {/* Navigation Links */}
            <div className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide py-2">
                <TooltipProvider delayDuration={0}>
                    {MENU_ITEMS.map((item) => {
                        const isActive = item.href === "/empleado"
                            ? pathname === "/empleado"
                            : pathname === item.href || pathname?.startsWith(item.href + "/");
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
                                            <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                                {item.name}
                                            </span>
                                        )}
                                        {!showLabel && isActive && (
                                            <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        )}
                                    </Link>
                                </TooltipTrigger>
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

            {/* Bottom Section */}
            <div className="p-3 mt-auto space-y-1 border-t border-zinc-50">
                <TooltipProvider delayDuration={0}>
                    {/* Profile */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/empleado/perfil"
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 group",
                                    pathname === "/empleado/perfil"
                                        ? "bg-primary/10 text-primary"
                                        : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                                )}
                            >
                                <UserCircle className="h-5 w-5 flex-shrink-0" />
                                {(!isCollapsed || mode === 'mobile') && <span className="font-medium text-sm">Mi Perfil</span>}
                            </Link>
                        </TooltipTrigger>
                        {isCollapsed && mode === 'desktop' &&
                            <TooltipContent side="right" className="bg-white text-zinc-900 border-zinc-200 shadow-md rounded-xl font-medium">
                                Mi Perfil
                            </TooltipContent>
                        }
                    </Tooltip>

                    {/* Logout Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => logout()}
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
