"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    UtensilsCrossed,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Package,
    FileText,
    User
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Menu Items Configuration - With submenu support
type MenuItem = {
    name: string;
    href: string;
    icon: any;
    subItems?: { name: string; href: string }[];
};

const MENU_ITEMS: MenuItem[] = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Pedidos", href: "/admin/dashboard/pedidos", icon: ShoppingBag },
    { name: "Menú y Productos", href: "/admin/dashboard/productos", icon: UtensilsCrossed },
    { name: "Insumos", href: "/admin/dashboard/insumos", icon: Package },
    { name: "Empleados", href: "/admin/dashboard/usuarios", icon: Users },
    {
        name: "Reportes",
        href: "/admin/dashboard/reportes",
        icon: FileText,
        subItems: [
            { name: "Dashboard", href: "/admin/dashboard/reportes" },
            { name: "Ingresos", href: "/admin/dashboard/reportes/ingresos" },
            { name: "Egresos", href: "/admin/dashboard/reportes/egresos" },
        ]
    },
];

interface SidebarProps {
    className?: string;
    mode?: 'desktop' | 'mobile'; // Support for mobile sheet usage
}

export function Sidebar({ className, mode = 'desktop' }: SidebarProps) {
    const pathname = usePathname();
    // If mobile, always expanded. If desktop, default collapsed.
    const [isCollapsed, setIsCollapsed] = useState(mode === 'desktop');
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Auto-expand parent if on a submenu page
    useEffect(() => {
        MENU_ITEMS.forEach(item => {
            if (item.subItems && pathname?.startsWith(item.href)) {
                setExpandedItems(prev => prev.includes(item.href) ? prev : [...prev, item.href]);
            }
        });
    }, [pathname]);

    const toggleSidebar = () => {
        if (mode === 'mobile') return;
        setIsCollapsed(!isCollapsed);
    };

    const toggleExpanded = (href: string) => {
        setExpandedItems(prev =>
            prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
        );
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
            <div className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide py-2">
                <TooltipProvider delayDuration={0}>
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isExpanded = expandedItems.includes(item.href);
                        const showLabel = !isCollapsed || mode === 'mobile';

                        return (
                            <div key={item.href}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 group active:scale-95 cursor-pointer",
                                                isActive && !hasSubItems
                                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                    : isActive && hasSubItems
                                                        ? "bg-zinc-100 text-zinc-900"
                                                        : "hover:bg-zinc-50 hover:text-zinc-900"
                                            )}
                                            onClick={() => {
                                                if (hasSubItems && showLabel) {
                                                    toggleExpanded(item.href);
                                                } else if (!hasSubItems) {
                                                    window.location.href = item.href;
                                                }
                                            }}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "h-5 w-5 flex-shrink-0 transition-colors",
                                                    isActive ? (hasSubItems ? "text-zinc-900" : "text-primary-foreground") : "text-zinc-400 group-hover:text-zinc-900"
                                                )}
                                            />

                                            {showLabel && (
                                                <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                                    {item.name}
                                                </span>
                                            )}

                                            {/* Chevron for submenus */}
                                            {hasSubItems && showLabel && (
                                                <ChevronDown
                                                    className={cn(
                                                        "h-4 w-4 transition-transform duration-200",
                                                        isExpanded && "rotate-180"
                                                    )}
                                                />
                                            )}

                                            {/* Active Indicator Dot for Collapsed Mode Desktop Only */}
                                            {!showLabel && isActive && (
                                                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    {/* Only show tooltip if collapsed and desktop */}
                                    {!showLabel && (
                                        <TooltipContent side="right" className="bg-white text-zinc-900 border-zinc-200 shadow-md rounded-xl font-medium">
                                            {item.name}
                                        </TooltipContent>
                                    )}
                                </Tooltip>

                                {/* Sub Items */}
                                {hasSubItems && showLabel && isExpanded && (
                                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-zinc-100 pl-3">
                                        {item.subItems!.map((subItem) => {
                                            const isSubActive = pathname === subItem.href;
                                            return (
                                                <Link
                                                    key={subItem.href}
                                                    href={subItem.href}
                                                    className={cn(
                                                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150",
                                                        isSubActive
                                                            ? "bg-primary/10 text-primary font-semibold"
                                                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        isSubActive ? "bg-primary" : "bg-zinc-300"
                                                    )} />
                                                    {subItem.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </TooltipProvider>
            </div>

            {/* Bottom Section: Config & User */}
            <div className="p-3 mt-auto space-y-1">

                <TooltipProvider delayDuration={0}>
                    {/* User Profile */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/admin/dashboard/perfil"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-zinc-50 transition-all duration-200 text-zinc-400 hover:text-zinc-900",
                                    pathname === '/admin/dashboard/perfil' && "bg-zinc-100 text-zinc-900"
                                )}
                            >
                                <User className="h-5 w-5 flex-shrink-0" />
                                {(!isCollapsed || mode === 'mobile') && <span className="font-medium text-sm">Mi Perfil</span>}
                            </Link>
                        </TooltipTrigger>
                        {isCollapsed && mode === 'desktop' &&
                            <TooltipContent side="right" className="bg-white text-zinc-900 border-zinc-200 shadow-md rounded-xl font-medium">
                                Mi Perfil
                            </TooltipContent>
                        }
                    </Tooltip>

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
