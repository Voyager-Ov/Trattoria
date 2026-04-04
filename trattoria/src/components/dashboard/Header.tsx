"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicBreadcrumb } from "./DynamicBreadcrumb";
import { HeaderSearch } from "./HeaderSearch";
import { useAuth } from "@/lib/hooks/useAuth";
import { getCurrentUserProfile } from "@/app/admin/dashboard/userActions";
import { getAdminPageLabel } from "./adminNavigation";

type HeaderProfile = {
    id: string;
    displayName: string | null;
    email: string;
    rol: "ADMIN" | "EMPLEADO";
    avatarUrl: string | null;
};

export function Header() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [profile, setProfile] = useState<HeaderProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const result = await getCurrentUserProfile();
            if (result.success) {
                setProfile(result.data ?? null);
            }
            setLoading(false);
        };

        fetchProfile();
    }, []);

    const currentPageLabel = getAdminPageLabel(pathname);
    const userDisplayName = profile?.displayName || profile?.email?.split("@")[0] || "Usuario";
    const userInitials = userDisplayName.substring(0, 2).toUpperCase();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200/70 bg-white/90 px-4 backdrop-blur-xl md:h-20 md:px-6">
            <div className="min-w-0 flex flex-1 items-center gap-3">
                <div className="hidden items-center gap-3 md:flex">
                </div>

                <div className="min-w-0 flex-1 md:hidden">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Panel admin</p>
                    <p className="truncate text-base font-semibold tracking-tight text-zinc-950">{currentPageLabel}</p>
                </div>

                <div className="hidden min-w-0 md:flex md:items-center">
                    {currentPageLabel === "Dashboard" ? (
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Panel admin</p>
                            <p className="text-lg font-bold tracking-tight text-zinc-950">Dashboard</p>
                        </div>
                    ) : (
                        <DynamicBreadcrumb />
                    )}
                </div>
            </div>

            <div className="hidden md:block">
                <HeaderSearch />
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
                            <p className="text-xs capitalize text-zinc-500">{profile?.rol?.toLowerCase() || "admin"}</p>
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
                            <Link href="/admin/dashboard/perfil" className="flex w-full items-center gap-2">
                                <UserIcon className="h-4 w-4 text-zinc-500" />
                                <span className="text-sm font-medium">Mi Perfil</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild className="cursor-pointer gap-2 rounded-xl p-3 focus:bg-zinc-50">
                            <Link href="/admin/dashboard/configuracion" className="flex w-full items-center gap-2">
                                <Settings className="h-4 w-4 text-zinc-500" />
                                <span className="text-sm font-medium">Configuración</span>
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
