"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Users, Search, UserPlus, MoreVertical, Shield, UserX, UserCheck, Mail, Calendar, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreateEmployeeSheet } from "./CreateEmployeeSheet";
import { getUsers, toggleUserStatus, updateUserRole } from "./userActions";

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    headerColor: string;
    icon?: React.ReactNode;
}

function MetricCard({ title, value, change, headerColor, icon }: MetricCardProps) {
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow duration-300">
            <div className={`h-12 ${headerColor} flex items-center px-6 text-white font-medium text-sm`}>
                {title}
                {icon && <div className="ml-auto opacity-80">{icon}</div>}
            </div>
            <div className="p-6 flex flex-col justify-between flex-grow">
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold text-zinc-900 tracking-tight">{value}</span>
                    {change && (
                        <span className="mb-1 bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider">
                            {change}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function EmpleadosPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<"TODOS" | "ADMIN" | "EMPLEADO">("TODOS");

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getUsers();
            if (result.success) {
                setUsers(result.data as any[]);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleStatus = async (user: any) => {
        const result = await toggleUserStatus(user.id, user.estado);
        if (result.success) {
            toast.success(`Empleado ${user.estado === 'ACTIVO' ? 'desactivado' : 'activado'} correctamente`);
            fetchUsers();
        } else {
            toast.error(result.error);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        const result = await updateUserRole(userId, newRole as any);
        if (result.success) {
            toast.success("Rol actualizado correctamente");
            fetchUsers();
        } else {
            toast.error(result.error);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole = roleFilter === "TODOS" || user.rol === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    // Metrics
    const totalEmployees = users.length;
    const activeEmployees = users.filter(u => u.estado === 'ACTIVO').length;
    const adminCount = users.filter(u => u.rol === 'ADMIN').length;
    const staffCount = users.filter(u => u.rol === 'EMPLEADO').length;

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Gestión de Empleados</h1>
                    <p className="text-zinc-500 mt-1">Controla el personal, roles y accesos al sistema.</p>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Personal"
                    value={totalEmployees}
                    headerColor="bg-zinc-900"
                    icon={<Users size={18} />}
                />
                <MetricCard
                    title="Acceso Activo"
                    value={activeEmployees}
                    change={`${((activeEmployees / totalEmployees) * 100 || 0).toFixed(0)}%`}
                    headerColor="bg-emerald-600"
                    icon={<UserCheck size={18} />}
                />
                <MetricCard
                    title="Administradores"
                    value={adminCount}
                    headerColor="bg-indigo-600"
                    icon={<Shield size={18} />}
                />
                <MetricCard
                    title="Staff / Empleados"
                    value={staffCount}
                    headerColor="bg-orange-500"
                    icon={<LayoutDashboard size={18} />}
                />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 bg-white p-5 rounded-[2rem] border border-zinc-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                        <Input
                            placeholder="Buscar empleados..."
                            className="pl-11 h-12 bg-zinc-50 border-zinc-200 rounded-full focus-visible:ring-zinc-400 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 rounded-full px-6 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium">
                                    {roleFilter === "TODOS" ? "Todos los roles" : roleFilter}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-zinc-100">
                                <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setRoleFilter("TODOS")}>Todos los roles</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setRoleFilter("ADMIN")}>Administradores</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setRoleFilter("EMPLEADO")}>Empleados</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-8 w-[1px] bg-zinc-200 mx-1"></div>

                        <CreateEmployeeSheet onSuccess={fetchUsers} />
                    </div>
                </div>
            </div>

            {/* Employees Table Container */}
            <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100">
                            <tr>
                                <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Empleado</th>
                                <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Rol / Permisos</th>
                                <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Estado de Acceso</th>
                                <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Fecha Alta</th>
                                <th className="text-right px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-6 py-8">
                                            <div className="flex items-center gap-4 animate-pulse">
                                                <div className="h-12 w-12 bg-zinc-100 rounded-2xl"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-zinc-100 rounded w-32"></div>
                                                    <div className="h-3 bg-zinc-100 rounded w-48"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
                                                <Users className="h-8 w-8 text-zinc-300" />
                                            </div>
                                            <p className="text-zinc-500 font-medium">No se encontraron empleados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-zinc-50/50 transition-all duration-150">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-11 w-11 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold border border-zinc-200">
                                                    {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-zinc-900 text-sm whitespace-nowrap">{user.displayName || "Sin nombre"}</span>
                                                    <div className="flex items-center gap-1.5 text-zinc-400 text-[0.7rem] mt-0.5">
                                                        <Mail size={10} />
                                                        <span>{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    user.rol === 'ADMIN'
                                                        ? "bg-indigo-50 text-indigo-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full"
                                                        : "bg-emerald-50 text-emerald-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full"
                                                }
                                            >
                                                {user.rol === 'ADMIN' ? 'ADMINISTRADOR' : 'EMPLEADO'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${user.estado === 'ACTIVO' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></div>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        user.estado === 'ACTIVO'
                                                            ? "bg-emerald-50 text-emerald-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full"
                                                            : "bg-red-50 text-red-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full"
                                                    }
                                                >
                                                    {user.estado}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                                                <Calendar size={12} className="text-zinc-300" />
                                                {format(new Date(user.createdAt), "dd MMM, yyyy", { locale: es })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100">
                                                        <MoreVertical className="h-4 w-4 text-zinc-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-zinc-100">
                                                    <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">Acciones de Empleado</DropdownMenuLabel>

                                                    <DropdownMenuItem
                                                        className="rounded-xl my-0.5 font-medium"
                                                        onClick={() => handleUpdateRole(user.id, user.rol === 'ADMIN' ? 'EMPLEADO' : 'ADMIN')}
                                                    >
                                                        <Shield size={14} className="mr-2 text-indigo-500" />
                                                        Cambiar a {user.rol === 'ADMIN' ? 'Empleado' : 'Administrador'}
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator className="bg-zinc-50 my-1" />

                                                    <DropdownMenuItem
                                                        className={`rounded-xl my-0.5 font-medium ${user.estado === 'ACTIVO' ? 'text-rose-600 hover:bg-rose-50 focus:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50 focus:bg-emerald-50'}`}
                                                        onClick={() => handleToggleStatus(user)}
                                                    >
                                                        {user.estado === 'ACTIVO' ? (
                                                            <><UserX size={14} className="mr-2" /> Suspender Acceso</>
                                                        ) : (
                                                            <><UserCheck size={14} className="mr-2" /> Activar Acceso</>
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
            </div>
        </div>
    );
}
