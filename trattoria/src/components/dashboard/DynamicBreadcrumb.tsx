"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Route name mapping
const ROUTE_NAMES: Record<string, string> = {
    dashboard: "Dashboard",
    pedidos: "Pedidos",
    productos: "Menú y Productos",
    insumos: "Insumos",
    usuarios: "Usuarios",
    reportes: "Reportes",
    configuracion: "Configuración",
    nuevo: "Nuevo",
    editar: "Editar",
    crear: "Crear",
    categoria: "Categoría",
    promocion: "Promoción",
};

interface DynamicBreadcrumbProps {
    className?: string;
}

export function DynamicBreadcrumb({ className }: DynamicBreadcrumbProps) {
    const pathname = usePathname();

    // Get all segments
    const allSegments = pathname.split("/").filter(Boolean);

    // Find our base (admin/dashboard)
    const dashboardIndex = allSegments.indexOf("dashboard");
    const adminIndex = allSegments.indexOf("admin");

    // Use the part after admin/dashboard for dynamic segments
    const baseIndex = Math.max(dashboardIndex, adminIndex);
    const meaningfulSegments = allSegments.slice(baseIndex + 1);

    // If we're on the dashboard home or not in admin/dashboard area, don't show dynamic breadcrumbs
    if (meaningfulSegments.length === 0) {
        return null;
    }

    // Correct base href
    const baseHref = "/admin/dashboard";

    return (
        <Breadcrumb className={className}>
            <BreadcrumbList>
                {/* Home / Dashboard Link */}
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href={baseHref} className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 transition-colors">
                            <Home className="h-4 w-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {/* Dynamic Segments */}
                {meaningfulSegments.map((segment, index) => {
                    const isLast = index === meaningfulSegments.length - 1;

                    // Construct href using all segments up to this one
                    const segmentInOriginalPathIndex = allSegments.indexOf(segment, baseIndex);
                    const href = "/" + allSegments.slice(0, segmentInOriginalPathIndex + 1).join("/");

                    const displayName = ROUTE_NAMES[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

                    return (
                        <div key={segment + index} className="flex items-center gap-2">
                            <BreadcrumbSeparator>
                                <ChevronRight className="h-4 w-4 text-zinc-400" />
                            </BreadcrumbSeparator>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-semibold text-zinc-900">
                                        {displayName}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href} className="text-zinc-600 hover:text-zinc-900 transition-colors">
                                            {displayName}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </div>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
