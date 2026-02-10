"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, User as UserIcon } from "lucide-react";
import { EmpleadoSidebar } from "./EmpleadoSidebar";
import { useAuth } from "@/lib/hooks/useAuth";
import { getCurrentUserProfile } from "@/app/admin/dashboard/userActions";
import { Skeleton } from "@/components/ui/skeleton";

export function EmpleadoHeader() {
    const { logout } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const result = await getCurrentUserProfile();
            if (result.success) {
                setProfile(result.data);
            }
            setLoading(false);
        };

        fetchProfile();
    }, []);

    const userDisplayName = profile?.displayName || profile?.email?.split('@')[0] || "Empleado";
    const userInitials = userDisplayName.substring(0, 2).toUpperCase();

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-white/80 backdrop-blur-md px-6 border-b border-zinc-100 shadow-sm">
            {/* Mobile Menu Trigger */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden rounded-xl border-zinc-200">
                        <Menu className="h-5 w-5 text-zinc-600" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-zinc-200 bg-white w-[280px]">
                    <div className="h-full">
                        <EmpleadoSidebar mode="mobile" className="w-full h-full border-none shadow-none" />
                    </div>
                </SheetContent>
            </Sheet>

            <div className="flex-1 flex items-center">
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Portal de Operaciones</h2>
            </div>

            {/* User & Actions */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        {loading ? (
                            <>
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-3 w-16 ml-auto" />
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-zinc-800 leading-none">{userDisplayName}</p>
                                <p className="text-xs text-muted-foreground capitalize">Empleado</p>
                            </>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                <AvatarImage src={profile?.avatarUrl || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {loading ? "..." : userInitials}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-zinc-100 shadow-xl">
                            <DropdownMenuLabel className="font-normal p-3">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-semibold text-zinc-800">{userDisplayName}</p>
                                    <p className="text-xs text-zinc-500 truncate">{profile?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-50" />
                            <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-zinc-50 cursor-pointer gap-2">
                                <Link href="/empleado/perfil" className="flex items-center gap-2 w-full">
                                    <UserCircle className="h-4 w-4 text-zinc-500" />
                                    <span className="text-sm font-medium">Mi Perfil</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-50" />
                            <DropdownMenuItem
                                className="rounded-xl p-3 focus:bg-rose-50 text-rose-600 focus:text-rose-600 cursor-pointer gap-2"
                                onClick={() => logout()}
                            >
                                <LogOut size={16} />
                                <span className="text-sm font-medium">Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}

// Helper icons that were missing
function UserCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </svg>
    )
}
