import {
    BarChart2,
    FileText,
    LayoutDashboard,
    Package,
    Settings,
    ShoppingBag,
    TrendingDown,
    TrendingUp,
    User,
    Users,
    UtensilsCrossed,
    Wallet,
    type LucideIcon,
} from "lucide-react";

export type AdminNavSubItem = {
    name: string;
    href: string;
    icon?: LucideIcon;
    description?: string;
};

export type AdminNavTone = {
    dot: string;
    softBg: string;
    softBorder: string;
    softText: string;
    hoverBg: string;
};

export type AdminNavItem = {
    key: string;
    name: string;
    shortName: string;
    href: string;
    icon: LucideIcon;
    tone: AdminNavTone;
    mobilePrimary?: boolean;
    mobileSecondary?: boolean;
    subItems?: AdminNavSubItem[];
};

const tones = {
    dashboard: {
        dot: "bg-sky-500",
        softBg: "bg-sky-500/10",
        softBorder: "border-sky-500/20",
        softText: "text-sky-700",
        hoverBg: "hover:bg-sky-500/5",
    },
    pedidos: {
        dot: "bg-amber-500",
        softBg: "bg-amber-500/10",
        softBorder: "border-amber-500/20",
        softText: "text-amber-700",
        hoverBg: "hover:bg-amber-500/5",
    },
    caja: {
        dot: "bg-emerald-600",
        softBg: "bg-emerald-500/10",
        softBorder: "border-emerald-500/20",
        softText: "text-emerald-700",
        hoverBg: "hover:bg-emerald-500/5",
    },
    productos: {
        dot: "bg-emerald-500",
        softBg: "bg-emerald-500/10",
        softBorder: "border-emerald-500/20",
        softText: "text-emerald-700",
        hoverBg: "hover:bg-emerald-500/5",
    },
    insumos: {
        dot: "bg-indigo-500",
        softBg: "bg-indigo-500/10",
        softBorder: "border-indigo-500/20",
        softText: "text-indigo-700",
        hoverBg: "hover:bg-indigo-500/5",
    },
    empleados: {
        dot: "bg-violet-500",
        softBg: "bg-violet-500/10",
        softBorder: "border-violet-500/20",
        softText: "text-violet-700",
        hoverBg: "hover:bg-violet-500/5",
    },
    reportes: {
        dot: "bg-rose-500",
        softBg: "bg-rose-500/10",
        softBorder: "border-rose-500/20",
        softText: "text-rose-700",
        hoverBg: "hover:bg-rose-500/5",
    },
    cuenta: {
        dot: "bg-zinc-700",
        softBg: "bg-zinc-900/5",
        softBorder: "border-zinc-900/10",
        softText: "text-zinc-700",
        hoverBg: "hover:bg-zinc-900/5",
    },
} satisfies Record<string, AdminNavTone>;

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
    {
        key: "dashboard",
        name: "Dashboard",
        shortName: "Inicio",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        tone: tones.dashboard,
        mobilePrimary: true,
    },
    {
        key: "pedidos",
        name: "Pedidos",
        shortName: "Pedidos",
        href: "/admin/dashboard/pedidos",
        icon: ShoppingBag,
        tone: tones.pedidos,
        mobilePrimary: true,
    },
    {
        key: "caja",
        name: "Caja",
        shortName: "Caja",
        href: "/admin/dashboard/caja",
        icon: Wallet,
        tone: tones.caja,
        mobileSecondary: true,
    },
    {
        key: "productos",
        name: "Menú y Productos",
        shortName: "Menú",
        href: "/admin/dashboard/productos",
        icon: UtensilsCrossed,
        tone: tones.productos,
        mobileSecondary: true,
    },
    {
        key: "insumos",
        name: "Insumos",
        shortName: "Insumos",
        href: "/admin/dashboard/insumos",
        icon: Package,
        tone: tones.insumos,
        mobilePrimary: true,
    },
    {
        key: "empleados",
        name: "Empleados",
        shortName: "Equipo",
        href: "/admin/dashboard/usuarios",
        icon: Users,
        tone: tones.empleados,
        mobileSecondary: true,
    },
    {
        key: "reportes",
        name: "Reportes",
        shortName: "Reportes",
        href: "/admin/dashboard/reportes",
        icon: FileText,
        tone: tones.reportes,
        mobilePrimary: true,
        subItems: [
            { name: "Dashboard", href: "/admin/dashboard/reportes", icon: BarChart2, description: "Resumen general" },
            { name: "Ingresos", href: "/admin/dashboard/reportes/ingresos", icon: TrendingUp, description: "Análisis de ingresos" },
            { name: "Egresos", href: "/admin/dashboard/reportes/egresos", icon: TrendingDown, description: "Análisis de egresos" },
        ],
    },
];

export const ADMIN_ACCOUNT_ITEMS: AdminNavItem[] = [
    {
        key: "perfil",
        name: "Mi Perfil",
        shortName: "Perfil",
        href: "/admin/dashboard/perfil",
        icon: User,
        tone: tones.cuenta,
        mobileSecondary: true,
    },
    {
        key: "configuracion",
        name: "Configuración",
        shortName: "Ajustes",
        href: "/admin/dashboard/configuracion",
        icon: Settings,
        tone: tones.cuenta,
        mobileSecondary: true,
    },
];

export const ADMIN_MOBILE_PRIMARY_ITEMS = ADMIN_NAV_ITEMS.filter((item) => item.mobilePrimary);
export const ADMIN_MOBILE_SECONDARY_ITEMS = [...ADMIN_NAV_ITEMS, ...ADMIN_ACCOUNT_ITEMS].filter((item) => item.mobileSecondary);

export function isAdminItemActive(pathname: string, item: AdminNavItem) {
    if (item.href === "/admin/dashboard") {
        return pathname === item.href;
    }

    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return true;
    }

    return item.subItems?.some((subItem) => pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)) ?? false;
}

export function isAdminMoreActive(pathname: string) {
    return ADMIN_MOBILE_SECONDARY_ITEMS.some((item) => isAdminItemActive(pathname, item));
}

export function getAdminPageLabel(pathname: string) {
    for (const item of ADMIN_NAV_ITEMS) {
        const matchedSubItem = item.subItems?.find((subItem) => pathname === subItem.href);
        if (matchedSubItem) {
            return matchedSubItem.name;
        }
    }

    const directMatch = [...ADMIN_NAV_ITEMS, ...ADMIN_ACCOUNT_ITEMS].find((item) => isAdminItemActive(pathname, item));
    if (directMatch) {
        return directMatch.name;
    }

    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments.at(-1);
    if (!lastSegment) {
        return "Dashboard";
    }

    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
}
