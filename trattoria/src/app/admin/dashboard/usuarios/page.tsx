"use client";

import { Users, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UsuariosPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Users size={18} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Usuarios</h2>
                </div>
                <p className="text-zinc-500 font-medium">Gestiona los accesos y roles del personal.</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-zinc-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
                        <Input
                            placeholder="Buscar usuarios..."
                            className="pl-11 h-12 bg-zinc-50 border-zinc-100 rounded-2xl"
                        />
                    </div>
                    <Button className="h-12 px-6 rounded-2xl gap-2 shadow-lg shadow-primary/20">
                        <UserPlus size={18} /> Nuevo Usuario
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-20 text-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 bg-zinc-50 rounded-3xl flex items-center justify-center">
                        <Users className="h-8 w-8 text-zinc-300" />
                    </div>
                    <p className="text-zinc-500 font-semibold tracking-tight">Módulo de Usuarios</p>
                    <p className="text-sm text-zinc-400">Próximamente: Gestión completa de personal y permisos.</p>
                </div>
            </div>
        </div>
    );
}
