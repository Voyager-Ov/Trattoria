"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Calendar,
    ChevronDown,
    Mail,
    MoreVertical,
    Search,
    Shield,
    UserCheck,
    UserPlus,
    UserX,
    Users,
} from "lucide-react";
import { toast } from "sonner";

import { CreateEmployeeSheet } from "./CreateEmployeeSheet";
import { getUsers, toggleUserStatus, updateUserRole } from "./userActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ResponsivePanel } from "@/components/ui/responsive-panel";

type RoleFilter = "TODOS" | "ADMIN" | "EMPLEADO";
type UserRole = "ADMIN" | "EMPLEADO";
type UserStatus = "ACTIVO" | "INACTIVO";

interface EmployeeUser {
    id: string;
    displayName?: string | null;
    email: string;
    rol: UserRole;
    estado: UserStatus;
    createdAt: string | Date;
}

function MetricCard({
    title,
    value,
    subtitle,
    headerColor,
    icon,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    headerColor: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className={`flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold text-white md:px-5 md:py-3 md:text-sm ${headerColor}`}>
                {title}
                <div className="opacity-80">{icon}</div>
            </div>
            <div className="p-3.5 md:p-6">
                <p className="break-words text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{value}</p>
                {subtitle ? <p className="mt-1 text-[13px] leading-snug text-zinc-500 md:text-sm">{subtitle}</p> : null}
            </div>
        </div>
    );
}

function getRoleBadgeClass(role: UserRole) {
    return role === "ADMIN" ? "bg-indigo-50 text-indigo-600 border-none" : "bg-emerald-50 text-emerald-600 border-none";
}

function getStatusBadgeClass(status: UserStatus) {
    return status === "ACTIVO" ? "bg-emerald-50 text-emerald-600 border-none" : "bg-red-50 text-red-600 border-none";
}

function getRoleLabel(role: UserRole) {
    return role === "ADMIN" ? "Administrador" : "Empleado";
}

function getRoleFilterLabel(role: RoleFilter) {
    if (role === "ADMIN") {
        return "Administradores";
    }
    if (role === "EMPLEADO") {
        return "Empleados";
    }
    return "Todos los roles";
}

function getUserInitial(user: EmployeeUser) {
    return user.displayName?.trim().charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase();
}

export default function EmpleadosPage() {
    const [users, setUsers] = useState<EmployeeUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("TODOS");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<EmployeeUser | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getUsers();
            if (result.success) {
                const nextUsers = (result.data || []) as EmployeeUser[];
                setUsers(nextUsers);
                setSelectedUser((current) => (current ? nextUsers.find((user) => user.id === current.id) ?? null : null));
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Error al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    const handleToggleStatus = async (user: EmployeeUser) => {
        const result = await toggleUserStatus(user.id, user.estado);
        if (result.success) {
            toast.success(`Empleado ${user.estado === "ACTIVO" ? "desactivado" : "activado"} correctamente`);
            await fetchUsers();
        } else {
            toast.error(result.error);
        }
    };

    const handleUpdateRole = async (user: EmployeeUser) => {
        const nextRole: UserRole = user.rol === "ADMIN" ? "EMPLEADO" : "ADMIN";
        const result = await updateUserRole(user.id, nextRole);
        if (result.success) {
            toast.success("Rol actualizado correctamente");
            await fetchUsers();
        } else {
            toast.error(result.error);
        }
    };

    const filteredUsers = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return users.filter((user) => {
            const matchesSearch =
                (user.displayName || "").toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term);
            const matchesRole = roleFilter === "TODOS" || user.rol === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    const totalEmployees = users.length;
    const activeEmployees = users.filter((user) => user.estado === "ACTIVO").length;
    const adminCount = users.filter((user) => user.rol === "ADMIN").length;
    const staffCount = users.filter((user) => user.rol === "EMPLEADO").length;

    return (
        <div className="app-page-safe-bottom animate-in space-y-5 fade-in pb-6 duration-500 md:space-y-8 md:pb-10">
            <section className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                                <Users className="h-5 w-5" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Gestion de empleados</h1>
                        </div>
                        <p className="text-sm font-medium text-zinc-500 md:text-base">Controla el personal, roles y accesos del sistema.</p>
                    </div>

                    <div className="w-full sm:w-auto">
                        <CreateEmployeeSheet onSuccess={fetchUsers} />
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-4">
                <MetricCard title="Total personal" value={totalEmployees} subtitle="usuarios con acceso" headerColor="bg-zinc-900" icon={<Users className="h-4 w-4" />} />
                <MetricCard
                    title="Acceso activo"
                    value={activeEmployees}
                    subtitle={`${totalEmployees > 0 ? ((activeEmployees / totalEmployees) * 100).toFixed(0) : 0}% del total`}
                    headerColor="bg-emerald-600"
                    icon={<UserCheck className="h-4 w-4" />}
                />
                <MetricCard title="Administradores" value={adminCount} subtitle="permisos completos" headerColor="bg-indigo-600" icon={<Shield className="h-4 w-4" />} />
                <MetricCard title="Staff" value={staffCount} subtitle="operacion diaria" headerColor="bg-orange-500" icon={<UserPlus className="h-4 w-4" />} />
            </div>

            <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                            placeholder="Buscar empleados..."
                            className="h-12 rounded-[2rem] border-zinc-200 bg-zinc-50 pl-11 text-sm shadow-none"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>

                    <div className="flex w-full items-center gap-3 md:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFiltersOpen(true)}
                            className="h-12 flex-1 rounded-[1.5rem] border-zinc-200 bg-white text-zinc-700 md:hidden"
                        >
                            <Shield className="mr-2 h-4 w-4" />
                            {getRoleFilterLabel(roleFilter)}
                        </Button>

                        <div className="hidden items-center gap-3 md:flex">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 rounded-full border-zinc-200 px-6 text-zinc-600">
                                        {getRoleFilterLabel(roleFilter)}
                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-2xl border-zinc-100 p-2 shadow-xl">
                                    <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setRoleFilter("TODOS")}>
                                        Todos los roles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setRoleFilter("ADMIN")}>
                                        Administradores
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setRoleFilter("EMPLEADO")}>
                                        Empleados
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <span className="hidden text-sm font-medium text-zinc-400 md:inline">{filteredUsers.length} resultados</span>
                    </div>
                </div>
            </section>

            <section className="space-y-3 md:hidden">
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="animate-pulse rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm">
                            <div className="h-4 w-32 rounded bg-zinc-100" />
                            <div className="mt-3 h-20 rounded-2xl bg-zinc-50" />
                        </div>
                    ))
                ) : filteredUsers.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
                        <p className="text-sm font-semibold text-zinc-500">No se encontraron empleados</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="w-full rounded-[1.75rem] border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-zinc-50"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 font-bold text-zinc-600">
                                    {getUserInitial(user)}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-base font-black tracking-tight text-zinc-900">{user.displayName || "Sin nombre"}</h3>
                                            <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                                                <Mail className="h-3.5 w-3.5 text-zinc-400" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                        </div>
                                        <div className={`mt-1 h-2.5 w-2.5 rounded-full ${user.estado === "ACTIVO" ? "bg-emerald-500" : "bg-red-400"}`} />
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" className={getRoleBadgeClass(user.rol)}>
                                            {getRoleLabel(user.rol)}
                                        </Badge>
                                        <Badge variant="secondary" className={getStatusBadgeClass(user.estado)}>
                                            {user.estado}
                                        </Badge>
                                    </div>

                                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(new Date(user.createdAt), "dd MMM, yyyy", { locale: es })}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </section>

            <section className="hidden overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm md:block">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-zinc-100 bg-zinc-50/50">
                            <tr>
                                <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Empleado</th>
                                <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Rol</th>
                                <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Estado</th>
                                <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Fecha alta</th>
                                <th className="px-6 py-5 text-right text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <tr key={index}>
                                        <td colSpan={5} className="px-6 py-8">
                                            <div className="flex items-center gap-4 animate-pulse">
                                                <div className="h-12 w-12 rounded-2xl bg-zinc-100" />
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 rounded bg-zinc-100" />
                                                    <div className="h-3 w-48 rounded bg-zinc-100" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
                                                <Users className="h-8 w-8 text-zinc-300" />
                                            </div>
                                            <p className="font-medium text-zinc-500">No se encontraron empleados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="transition-all duration-150 hover:bg-zinc-50/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 font-bold text-zinc-600">
                                                    {getUserInitial(user)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-zinc-900">{user.displayName || "Sin nombre"}</p>
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] text-zinc-400">
                                                        <Mail className="h-3 w-3" />
                                                        <span>{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className={getRoleBadgeClass(user.rol)}>
                                                {user.rol === "ADMIN" ? "ADMINISTRADOR" : "EMPLEADO"}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${user.estado === "ACTIVO" ? "bg-emerald-500" : "bg-red-400"}`} />
                                                <Badge variant="secondary" className={getStatusBadgeClass(user.estado)}>
                                                    {user.estado}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-zinc-500">
                                            {format(new Date(user.createdAt), "dd MMM, yyyy", { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-zinc-100">
                                                        <MoreVertical className="h-4 w-4 text-zinc-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-zinc-100 p-2 shadow-xl">
                                                    <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">
                                                        Acciones
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuItem className="my-0.5 rounded-xl font-medium" onClick={() => void handleUpdateRole(user)}>
                                                        <Shield className="mr-2 h-4 w-4 text-indigo-500" />
                                                        Cambiar a {user.rol === "ADMIN" ? "Empleado" : "Administrador"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1 bg-zinc-100" />
                                                    <DropdownMenuItem
                                                        className={`my-0.5 rounded-xl font-medium ${
                                                            user.estado === "ACTIVO"
                                                                ? "text-rose-600 hover:bg-rose-50 focus:bg-rose-50"
                                                                : "text-emerald-600 hover:bg-emerald-50 focus:bg-emerald-50"
                                                        }`}
                                                        onClick={() => void handleToggleStatus(user)}
                                                    >
                                                        {user.estado === "ACTIVO" ? (
                                                            <>
                                                                <UserX className="mr-2 h-4 w-4" />
                                                                Suspender acceso
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                Activar acceso
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ResponsivePanel
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                title="Filtro de rol"
                description="Refina la lista de empleados en mobile."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-md"
            >
                <div className="space-y-2">
                    {(["TODOS", "ADMIN", "EMPLEADO"] as RoleFilter[]).map((role) => (
                        <button
                            key={role}
                            type="button"
                            onClick={() => {
                                setRoleFilter(role);
                                setFiltersOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                                roleFilter === role ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                            }`}
                        >
                            <span>{getRoleFilterLabel(role)}</span>
                            {roleFilter === role ? <span className="text-xs font-black">ON</span> : null}
                        </button>
                    ))}
                </div>
            </ResponsivePanel>

            <ResponsivePanel
                open={selectedUser != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedUser(null);
                    }
                }}
                title={selectedUser?.displayName || selectedUser?.email || "Detalle del empleado"}
                description="Resumen del perfil y acciones de acceso."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-lg"
            >
                {selectedUser ? (
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] border border-zinc-200 bg-zinc-100 text-xl font-black text-zinc-600">
                                {getUserInitial(selectedUser)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-xl font-black tracking-tight text-zinc-900">{selectedUser.displayName || "Sin nombre"}</h3>
                                <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                                    <Mail className="h-4 w-4 text-zinc-400" />
                                    <span className="truncate">{selectedUser.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Rol</p>
                                <p className="mt-1 text-sm font-bold text-zinc-900">{getRoleLabel(selectedUser.rol)}</p>
                            </div>
                            <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Estado</p>
                                <p className="mt-1 text-sm font-bold text-zinc-900">{selectedUser.estado}</p>
                            </div>
                            <div className="col-span-2 rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Fecha de alta</p>
                                <p className="mt-1 text-sm font-bold text-zinc-900">{format(new Date(selectedUser.createdAt), "dd MMM, yyyy", { locale: es })}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className={getRoleBadgeClass(selectedUser.rol)}>
                                {getRoleLabel(selectedUser.rol)}
                            </Badge>
                            <Badge variant="secondary" className={getStatusBadgeClass(selectedUser.estado)}>
                                {selectedUser.estado}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Button type="button" className="h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800" onClick={() => void handleUpdateRole(selectedUser)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Cambiar a {selectedUser.rol === "ADMIN" ? "Empleado" : "Administrador"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className={`h-11 rounded-2xl ${
                                    selectedUser.estado === "ACTIVO"
                                        ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                }`}
                                onClick={() => void handleToggleStatus(selectedUser)}
                            >
                                {selectedUser.estado === "ACTIVO" ? (
                                    <>
                                        <UserX className="mr-2 h-4 w-4" />
                                        Suspender acceso
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Activar acceso
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </ResponsivePanel>

            <div aria-hidden className="rounded-[1.75rem] bg-white/55 md:hidden" style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }} />
        </div>
    );
}
