"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/hooks/useAuth";
import { getCurrentUserProfile } from "@/app/admin/dashboard/userActions";
import { getEmployeePageLabel } from "./employeeNavigation";

type HeaderProfile = {
    id: string;
    displayName: string | null;
    email: string;
    rol: "ADMIN" | "EMPLEADO";
    avatarUrl: string | null;
};

export function EmpleadoHeader() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [profile, setProfile] = useState<HeaderProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const result = await getCurrentUserProfile();
            if (result.success) {
                setProfile((result.data as HeaderProfile | null) ?? null);
            }
            setLoading(false);
        };

        void fetchProfile();
    }, []);

    const currentPageLabel = getEmployeePageLabel(pathname);
    const userDisplayName = profile?.displayName || profile?.email?.split("@")[0] || "Empleado";
    const userInitials = userDisplayName.substring(0, 2).toUpperCase();

    return (
        <header className="app-header-safe sticky top-0 z-30 flex min-h-16 items-end gap-3 border-b border-zinc-200/60 bg-transparent pb-3 md:min-h-20 md:items-center md:pb-0">
            <div className="min-w-0 flex flex-1 items-center gap-3">
                <div className="min-w-0 flex-1 md:hidden">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Portal empleado</p>
                    <p className="truncate text-base font-semibold tracking-tight text-zinc-950">{currentPageLabel}</p>
                </div>

                <div className="hidden min-w-0 md:flex md:items-center">
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Portal empleado</p>
                        <p className="text-lg font-bold tracking-tight text-zinc-950">{currentPageLabel}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden text-right md:block">
                    {loading ? (
                        <>
                            <Skeleton className="mb-1 h-4 w-24" />
                            <Skeleton className="ml-auto h-3 w-16" />
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-semibold leading-none text-zinc-800">{userDisplayName}</p>
                            <p className="text-xs capitalize text-zinc-500">empleado</p>
                        </>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="rounded-full transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                        >
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm md:h-11 md:w-11">
                                <AvatarImage src={profile?.avatarUrl || ""} />
                                <AvatarFallback className="bg-zinc-900 text-sm font-bold text-white">
                                    {loading ? "..." : userInitials}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-60 rounded-2xl border-zinc-200 p-2 shadow-xl">
                        <DropdownMenuLabel className="p-3 font-normal">
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold text-zinc-800">{userDisplayName}</p>
                                <p className="truncate text-xs text-zinc-500">{profile?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-100" />

                        <DropdownMenuItem asChild className="cursor-pointer gap-2 rounded-xl p-3 focus:bg-zinc-50">
                            <Link href="/empleado/perfil" className="flex w-full items-center gap-2">
                                <UserIcon className="h-4 w-4 text-zinc-500" />
                                <span className="text-sm font-medium">Mi Perfil</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-zinc-100" />

                        <DropdownMenuItem
                            className="cursor-pointer gap-2 rounded-xl p-3 text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                            onClick={() => logout()}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm font-medium">Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
