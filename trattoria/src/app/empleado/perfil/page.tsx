"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";

import { useAuth } from "@/lib/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { ProfileForm } from "./profile-form";
import { SecurityCard } from "./security-card";

export default function EmpleadoProfilePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, router, user]);

    if (loading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-sm font-medium text-zinc-500">Cargando perfil...</p>
            </div>
        );
    }

    return (
        <div className="app-page-safe-bottom flex min-h-screen flex-col gap-6 bg-white px-4 py-4 sm:px-6 md:gap-8 md:px-8 md:py-8">
            <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-zinc-950 p-6 text-white shadow-xl shadow-zinc-200 md:p-8">
                <Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-white/10">
                    Perfil de empleado
                </Badge>
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Mi perfil</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                    Actualiza tu informacion personal y el acceso a la cuenta desde el mismo lenguaje visual del portal nuevo.
                </p>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <article className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                            <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-zinc-950">Informacion personal</h2>
                            <p className="mt-1 text-sm text-zinc-500">Email, nombre y telefono del usuario operativo.</p>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <ProfileForm user={user} />
                </article>

                <article className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-zinc-950">Seguridad</h2>
                            <p className="mt-1 text-sm text-zinc-500">Gestiona la contrasena asociada a tu cuenta.</p>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <SecurityCard />

                    <div className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-900">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                            <p>Mantener actualizados tus datos y credenciales ayuda a sostener el acceso operativo del turno sin depender del admin.</p>
                        </div>
                    </div>
                </article>
            </section>
        </div>
    );
}
