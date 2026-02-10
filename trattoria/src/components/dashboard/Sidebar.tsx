"use client";

import Link from "next/link";
import Image from "next/image";
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
import { useAuth } from "@/lib/hooks/useAuth";
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
    activeColor: string; // Color de fondo cuando está activo
    activeTextColor: string; // Color del texto cuando está activo
    hoverColor: string; // Color en hover
    subItems?: { name: string; href: string }[];
};

const MENU_ITEMS: MenuItem[] = [
    { 
        name: "Dashboard", 
        href: "/admin/dashboard", 
        icon: LayoutDashboard,
        activeColor: "bg-blue-500/10",
        activeTextColor: "text-blue-600",
        hoverColor: "hover:bg-blue-500/5"
    },
    { 
        name: "Pedidos", 
        href: "/admin/dashboard/pedidos", 
        icon: ShoppingBag,
        activeColor: "bg-orange-500/10",
        activeTextColor: "text-orange-600",
        hoverColor: "hover:bg-orange-500/5"
    },
    { 
        name: "Menú y Productos", 
        href: "/admin/dashboard/productos", 
        icon: UtensilsCrossed,
        activeColor: "bg-emerald-500/10",
        activeTextColor: "text-emerald-600",
        hoverColor: "hover:bg-emerald-500/5"
    },
    { 
        name: "Insumos", 
        href: "/admin/dashboard/insumos", 
        icon: Package,
        activeColor: "bg-indigo-500/10",
        activeTextColor: "text-indigo-600",
        hoverColor: "hover:bg-indigo-500/5"
    },
    { 
        name: "Empleados", 
        href: "/admin/dashboard/usuarios", 
        icon: Users,
        activeColor: "bg-violet-500/10",
        activeTextColor: "text-violet-600",
        hoverColor: "hover:bg-violet-500/5"
    },
    {
        name: "Reportes",
        href: "/admin/dashboard/reportes",
        icon: FileText,
        activeColor: "bg-rose-500/10",
        activeTextColor: "text-rose-600",
        hoverColor: "hover:bg-rose-500/5",
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

export function AdminSidebar({ className, mode = 'desktop' }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [mounted, setMounted] = useState(false);
    // If mobile, always expanded. If desktop, default collapsed.
    const [isCollapsed, setIsCollapsed] = useState(mode === 'desktop');
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Handle hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-expand parent if on a submenu page
    useEffect(() => {
        MENU_ITEMS.forEach(item => {
            if (item.subItems && (pathname === item.href || pathname?.startsWith(item.href + "/"))) {
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

    if (!mounted) return <div className={cn("h-screen bg-white border-r border-zinc-100", isCollapsed ? "w-[80px]" : "w-[260px]")} />;

    return (
        <TooltipProvider delayDuration={0}>
            <div
                className={cn(
                    "relative flex flex-col h-screen bg-white text-zinc-500 border-r border-zinc-200 transition-all duration-300 ease-in-out overflow-hidden",
                    mode === 'desktop' ? (isCollapsed ? "w-[80px]" : "w-[260px]") : "w-full",
                    className
                )}
            >
                {/* Toggle Button - Desktop Only */}
                {mode === 'desktop' && (
                    <Button
                        onClick={toggleSidebar}
                        variant="ghost"
                        size="icon"
                        className="absolute -right-3 top-6 h-7 w-7 rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 z-50 hidden md:flex shadow-lg transition-all duration-300"
                    >
                        {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                    </Button>
                )}

                {/* Header / Logo */}
                <div className={cn(
                    "flex items-center h-20 px-4 mb-2 transition-all duration-300",
                    isCollapsed && mode === 'desktop' ? "justify-center" : "justify-start gap-3"
                )}>
                    <div className="relative h-12 w-12 flex-shrink-0 bg-zinc-900 rounded-2xl overflow-hidden shadow-lg ring-2 ring-zinc-900/5">
                        <Image 
                            src="/tratologo.png" 
                            alt="Logo" 
                            fill 
                            className="object-cover"
                        />
                    </div>
                    {(!isCollapsed || mode === 'mobile') && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-zinc-900 font-black tracking-tight leading-none text-lg uppercase">TRATTORIA</span>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mt-0.5">Management</span>
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <div className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar py-2">
                    {MENU_ITEMS.map((item) => {
                        const isActive = item.href === "/admin/dashboard" 
                            ? pathname === "/admin/dashboard" 
                            : pathname === item.href || pathname?.startsWith(item.href + "/");
                        
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isExpanded = expandedItems.includes(item.href);
                        const showLabel = !isCollapsed || mode === 'mobile';

                        const content = (
                            <>
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 flex-shrink-0 transition-all duration-300",
                                        isActive ? item.activeTextColor : "text-zinc-400 group-hover:text-zinc-900"
                                    )}
                                />

                                {showLabel && (
                                    <span className={cn(
                                        "font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1 tracking-tight transition-all duration-300",
                                        isActive && [item.activeTextColor, "font-bold"],
                                        !isActive && "text-zinc-600 group-hover:text-zinc-900"
                                    )}>
                                        {item.name}
                                    </span>
                                )}

                                {hasSubItems && showLabel && (
                                    <ChevronDown
                                        className={cn(
                                            "h-4 w-4 transition-all duration-300",
                                            isActive ? item.activeTextColor : "text-zinc-400 group-hover:text-zinc-600",
                                            isExpanded && "rotate-180"
                                        )}
                                    />
                                )}
                            </>
                        );

                        const commonClasses = cn(
                            "flex items-center gap-3 py-3 rounded-2xl transition-all duration-300 group cursor-pointer relative overflow-hidden",
                            showLabel ? "px-4" : "justify-center px-0 w-14 mx-auto",
                            isActive && [
                                item.activeColor,
                                "shadow-sm ring-1 ring-black/5"
                            ],
                            !isActive && [
                                "text-zinc-500 hover:bg-zinc-50 hover:shadow-sm active:scale-[0.98]",
                                item.hoverColor
                            ]
                        );

                        return (
                            <div key={item.href} className="space-y-1 relative">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        {hasSubItems ? (
                                            <div
                                                className={commonClasses}
                                                onClick={() => {
                                                    if (showLabel) {
                                                        toggleExpanded(item.href);
                                                    }
                                                }}
                                            >
                                                {content}
                                            </div>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                className={commonClasses}
                                            >
                                                {content}
                                            </Link>
                                        )}
                                    </TooltipTrigger>
                                    {!showLabel && (
                                        <TooltipContent side="right" sideOffset={20} className="bg-zinc-900 text-white border-none shadow-xl rounded-2xl font-semibold px-4 py-2.5 z-[100]">
                                            {item.name}
                                        </TooltipContent>
                                    )}
                                </Tooltip>

                                {/* Sub Items */}
                                {hasSubItems && showLabel && isExpanded && (
                                    <div className="ml-8 mt-1.5 space-y-1 pl-4 border-l-2 border-zinc-200">
                                        {item.subItems!.map((subItem) => {
                                            const isSubActive = pathname === subItem.href;
                                            return (
                                                <Link
                                                    key={subItem.href}
                                                    href={subItem.href}
                                                    className={cn(
                                                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-300 group/sub",
                                                        isSubActive && [
                                                            item.activeColor,
                                                            item.activeTextColor,
                                                            "font-semibold shadow-sm"
                                                        ],
                                                        !isSubActive && [
                                                            "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-medium active:scale-[0.98]",
                                                            item.hoverColor
                                                        ]
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                        isSubActive ? [
                                                            item.activeTextColor.replace('text-', 'bg-'),
                                                            "scale-125"
                                                        ] : "bg-zinc-300 group-hover/sub:bg-zinc-400"
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
                </div>

                {/* Bottom Section */}
                {(() => {
                    const showLabel = !isCollapsed || mode === 'mobile';
                    return (
                        <div className="p-3 mt-auto space-y-1 border-t border-zinc-200">
                            {/* User Profile */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/admin/dashboard/perfil"
                                        className={cn(
                                            "flex items-center gap-3 py-3 rounded-2xl transition-all duration-300 group",
                                            showLabel ? "px-4" : "justify-center px-0 w-14 mx-auto",
                                            pathname === '/admin/dashboard/perfil' 
                                                ? "bg-zinc-900/10 text-zinc-900 shadow-sm ring-1 ring-black/5"
                                                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 hover:shadow-sm active:scale-[0.98]"
                                        )}
                                    >
                                        <User className="h-5 w-5 flex-shrink-0" />
                                        {showLabel && <span className="font-semibold text-sm tracking-tight">Mi Perfil</span>}
                                    </Link>
                                </TooltipTrigger>
                                {!showLabel && (
                                    <TooltipContent side="right" sideOffset={20} className="bg-zinc-900 text-white border-none shadow-xl rounded-2xl font-semibold px-4 py-2.5 z-[100]">
                                        Mi Perfil
                                    </TooltipContent>
                                )}
                            </Tooltip>

                            {/* Settings */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/admin/dashboard/configuracion"
                                        className={cn(
                                            "flex items-center gap-3 py-3 rounded-2xl transition-all duration-300 group",
                                            showLabel ? "px-4" : "justify-center px-0 w-14 mx-auto",
                                            pathname === '/admin/dashboard/configuracion'
                                                ? "bg-zinc-900/10 text-zinc-900 shadow-sm ring-1 ring-black/5"
                                                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 hover:shadow-sm active:scale-[0.98]"
                                        )}
                                    >
                                        <Settings className="h-5 w-5 flex-shrink-0" />
                                        {showLabel && <span className="font-semibold text-sm tracking-tight">Configuración</span>}
                                    </Link>
                                </TooltipTrigger>
                                {!showLabel && (
                                    <TooltipContent side="right" sideOffset={20} className="bg-zinc-900 text-white border-none shadow-xl rounded-2xl font-semibold px-4 py-2.5 z-[100]">
                                        Configuración
                                    </TooltipContent>
                                )}
                            </Tooltip>

                            {/* Logout */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => logout()}
                                        className={cn(
                                            "w-full flex items-center gap-3 py-3 rounded-2xl text-zinc-500 hover:bg-red-50/90 hover:text-red-600 transition-all duration-300 active:scale-[0.98]",
                                            showLabel ? "px-4" : "justify-center px-0 w-14 mx-auto"
                                        )}
                                    >
                                        <LogOut className="h-5 w-5 flex-shrink-0" />
                                        {showLabel && <span className="font-semibold text-sm tracking-tight text-left">Cerrar Sesión</span>}
                                    </button>
                                </TooltipTrigger>
                                {!showLabel && (
                                    <TooltipContent side="right" sideOffset={20} className="bg-red-500 text-white border-none shadow-xl rounded-2xl font-semibold px-4 py-2.5 z-[100]">
                                        Cerrar Sesión
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                    );
                })()}
            </div>
        </TooltipProvider>
    );
}
