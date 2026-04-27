import { LayoutDashboard, Package, ShoppingBag, User, UtensilsCrossed, Wallet, type LucideIcon } from "lucide-react";

export type EmployeeNavTone = {
    dot: string;
    softBg: string;
    softBorder: string;
    softText: string;
    hoverBg: string;
};

export type EmployeeNavItem = {
    key: string;
    name: string;
    shortName: string;
    href: string;
    icon: LucideIcon;
    tone: EmployeeNavTone;
    mobilePrimary?: boolean;
    mobileSecondary?: boolean;
};

const tones = {
    dashboard: {
        dot: "bg-sky-500",
        softBg: "bg-sky-500/10",
        softBorder: "border-sky-500/20",
        softText: "text-sky-700",
        hoverBg: "hover:bg-sky-500/5",
    },
    caja: {
        dot: "bg-emerald-600",
        softBg: "bg-emerald-500/10",
        softBorder: "border-emerald-500/20",
        softText: "text-emerald-700",
        hoverBg: "hover:bg-emerald-500/5",
    },
    pedidos: {
        dot: "bg-amber-500",
        softBg: "bg-amber-500/10",
        softBorder: "border-amber-500/20",
        softText: "text-amber-700",
        hoverBg: "hover:bg-amber-500/5",
    },
    insumos: {
        dot: "bg-indigo-500",
        softBg: "bg-indigo-500/10",
        softBorder: "border-indigo-500/20",
        softText: "text-indigo-700",
        hoverBg: "hover:bg-indigo-500/5",
    },
    productos: {
        dot: "bg-emerald-500",
        softBg: "bg-emerald-500/10",
        softBorder: "border-emerald-500/20",
        softText: "text-emerald-700",
        hoverBg: "hover:bg-emerald-500/5",
    },
    cuenta: {
        dot: "bg-zinc-700",
        softBg: "bg-zinc-900/5",
        softBorder: "border-zinc-900/10",
        softText: "text-zinc-700",
        hoverBg: "hover:bg-zinc-900/5",
    },
} satisfies Record<string, EmployeeNavTone>;

export const EMPLOYEE_NAV_ITEMS: EmployeeNavItem[] = [
    {
        key: "dashboard",
        name: "Dashboard",
        shortName: "Inicio",
        href: "/empleado",
        icon: LayoutDashboard,
        tone: tones.dashboard,
        mobilePrimary: true,
    },
    {
        key: "caja",
        name: "Caja",
        shortName: "Caja",
        href: "/empleado/caja",
        icon: Wallet,
        tone: tones.caja,
        mobilePrimary: true,
    },
    {
        key: "pedidos",
        name: "Pedidos",
        shortName: "Pedidos",
        href: "/empleado/pedidos",
        icon: ShoppingBag,
        tone: tones.pedidos,
        mobilePrimary: true,
    },
    {
        key: "insumos",
        name: "Insumos",
        shortName: "Insumos",
        href: "/empleado/insumos",
        icon: Package,
        tone: tones.insumos,
        mobilePrimary: true,
    },
    {
        key: "productos",
        name: "Menú y Productos",
        shortName: "Menú",
        href: "/empleado/productos",
        icon: UtensilsCrossed,
        tone: tones.productos,
        mobileSecondary: true,
    },
];

export const EMPLOYEE_ACCOUNT_ITEMS: EmployeeNavItem[] = [
    {
        key: "perfil",
        name: "Mi Perfil",
        shortName: "Perfil",
        href: "/empleado/perfil",
        icon: User,
        tone: tones.cuenta,
        mobileSecondary: true,
    },
];

export const EMPLOYEE_MOBILE_PRIMARY_ITEMS = EMPLOYEE_NAV_ITEMS.filter((item) => item.mobilePrimary);
export const EMPLOYEE_MOBILE_SECONDARY_ITEMS = [...EMPLOYEE_NAV_ITEMS, ...EMPLOYEE_ACCOUNT_ITEMS].filter((item) => item.mobileSecondary);

export function isEmployeeItemActive(pathname: string, item: EmployeeNavItem) {
    if (item.href === "/empleado") {
        return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function isEmployeeMoreActive(pathname: string) {
    return EMPLOYEE_MOBILE_SECONDARY_ITEMS.some((item) => isEmployeeItemActive(pathname, item));
}

export function getEmployeePageLabel(pathname: string) {
    const directMatch = [...EMPLOYEE_NAV_ITEMS, ...EMPLOYEE_ACCOUNT_ITEMS].find((item) => isEmployeeItemActive(pathname, item));
    if (directMatch) {
        return directMatch.name;
    }

    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments.at(-1);
    if (!lastSegment) {
        return "Dashboard";
    }

    const map: Record<string, string> = {
        nuevo: "Nuevo",
        editar: "Editar",
        stock: "Stock",
    };

    return map[lastSegment] ?? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
}
