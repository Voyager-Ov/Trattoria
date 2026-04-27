"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ROUTE_NAMES: Record<string, string> = {
    empleado: "Dashboard",
    pedidos: "Pedidos",
    insumos: "Insumos",
    productos: "Menu",
    perfil: "Mi Perfil",
    nuevo: "Nuevo",
    editar: "Editar",
    stock: "Stock",
    promociones: "Promociones",
};

export function EmployeeBreadcrumb() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);
    const employeeIndex = segments.indexOf("empleado");
    const meaningfulSegments = segments.slice(employeeIndex + 1);

    if (meaningfulSegments.length === 0) {
        return null;
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/empleado" className="flex items-center gap-1 text-zinc-600 transition-colors hover:text-zinc-900">
                            <Home className="h-4 w-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {meaningfulSegments.map((segment, index) => {
                    const isLast = index === meaningfulSegments.length - 1;
                    const href = `/${segments.slice(0, employeeIndex + index + 2).join("/")}`;
                    const label = ROUTE_NAMES[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

                    return (
                        <div key={`${segment}-${index}`} className="flex items-center gap-2">
                            <BreadcrumbSeparator>
                                <ChevronRight className="h-4 w-4 text-zinc-400" />
                            </BreadcrumbSeparator>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-semibold text-zinc-900">{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href} className="text-zinc-600 transition-colors hover:text-zinc-900">
                                            {label}
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
