"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResponsivePanel } from "@/components/ui/responsive-panel";

interface CashboxBlockedDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    targetHref?: string;
}

export function CashboxBlockedDialog({
    open,
    onOpenChange,
    title = "Necesitas abrir caja",
    description = "Para cobrar pedidos o registrar movimientos financieros primero debes abrir una caja en el panel de Caja.",
    targetHref = "/admin/dashboard/caja",
}: CashboxBlockedDialogProps) {
    const router = useRouter();

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={onOpenChange}
            title={<span className="sr-only">{title}</span>}
            description={<span className="sr-only">{description}</span>}
            desktopMode="dialog"
            mobileSide="bottom"
            hideHeader
            contentClassName="max-w-md overflow-hidden rounded-[2rem] border-zinc-200 bg-white p-0"
            desktopContentClassName="p-0"
        >
            <div className="relative overflow-hidden rounded-[2rem]">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-emerald-500" />

                <div className="space-y-6 p-6 md:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Bloqueo operativo</p>
                            <h3 className="text-2xl font-black tracking-tight text-zinc-950">{title}</h3>
                            <p className="text-sm font-medium leading-relaxed text-zinc-500">{description}</p>
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                            <div className="space-y-1 text-sm text-zinc-500">
                                <p className="font-semibold text-zinc-700">QuÃ© puedes hacer ahora</p>
                                <p>Abre una caja con monto inicial real. Cuando quede activa, podrÃ¡s volver a cobrar el pedido.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                            type="button"
                            onClick={() => {
                                onOpenChange(false);
                                router.push(targetHref);
                            }}
                            className="h-12 rounded-2xl bg-zinc-950 font-bold text-white hover:bg-zinc-800"
                        >
                            Ir a Caja
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-12 rounded-2xl border-zinc-200 font-semibold text-zinc-600"
                        >
                            Volver
                        </Button>
                    </div>
                </div>
            </div>
        </ResponsivePanel>
    );
}
