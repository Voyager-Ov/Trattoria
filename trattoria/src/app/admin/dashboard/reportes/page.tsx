"use client";

import { BarChart3, Search, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportesPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <BarChart3 size={18} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Reportes</h2>
                </div>
                <p className="text-zinc-500 font-medium">Análisis de ventas y rendimiento del negocio.</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-zinc-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-4 h-12 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-500 text-sm font-medium">
                            <Calendar size={16} /> Últimos 30 días
                        </div>
                    </div>
                    <Button variant="outline" className="h-12 px-6 rounded-2xl gap-2 text-zinc-600 border-zinc-200">
                        <Download size={18} /> Exportar Datos
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-20 text-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 bg-zinc-50 rounded-3xl flex items-center justify-center">
                        <BarChart3 className="h-8 w-8 text-zinc-300" />
                    </div>
                    <p className="text-zinc-500 font-semibold tracking-tight">Módulo de Reportes</p>
                    <p className="text-sm text-zinc-400">Próximamente: Gráficos avanzados y estadísticas detalladas.</p>
                </div>
            </div>
        </div>
    );
}
