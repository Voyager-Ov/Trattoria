"use client";

import Link from "next/link";
import { ChevronRight, Clock, ShoppingBasket } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/utils";

import type { RecentActivityItem } from "./dashboard-types";

interface RecentOrdersCardProps {
    loading: boolean;
    activity: RecentActivityItem[];
}

function getStatusClasses(status: string) {
    if (status === "FINALIZADO") {
        return "bg-emerald-50 text-emerald-600";
    }

    if (status === "CANCELADO") {
        return "bg-rose-50 text-rose-600";
    }

    return "bg-orange-50 text-orange-600";
}

export function RecentOrdersCard({ loading, activity }: RecentOrdersCardProps) {
    const isMobile = useIsMobile();
    const visibleOrders = isMobile ? activity.slice(0, 4) : activity;
    const skeletonCount = isMobile ? 4 : 5;

    return (
        <section className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2.5rem]">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 sm:px-6 md:px-8 md:py-6">
                <div>
                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 md:text-xl">Actividad reciente</h3>
                    <p className="mt-1 text-sm text-zinc-400">Ultimos pedidos registrados en el sistema</p>
                </div>

                <Link href="/admin/dashboard/pedidos" className="hidden md:inline-flex">
                    <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full p-0 hover:bg-zinc-100">
                        <ChevronRight className="h-5 w-5 text-zinc-400" />
                    </Button>
                </Link>
            </div>

            <div className="flex-grow space-y-3 px-4 py-4 md:max-h-[500px] md:space-y-4 md:overflow-y-auto md:px-6 md:py-6">
                {loading ? (
                    Array.from({ length: skeletonCount }).map((_, index) => (
                        <div key={index} className="flex animate-pulse items-center gap-3 rounded-[1.5rem] bg-zinc-50 p-3.5 md:p-4">
                            <div className="h-11 w-11 rounded-2xl bg-zinc-100 md:h-12 md:w-12" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/2 rounded bg-zinc-100" />
                                <div className="h-3 w-1/3 rounded bg-zinc-100" />
                            </div>
                        </div>
                    ))
                ) : visibleOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-12 text-center md:px-8">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 md:h-20 md:w-20">
                            <ShoppingBasket size={28} className="text-zinc-200 md:h-8 md:w-8" />
                        </div>
                        <h4 className="font-bold text-zinc-900">Sin pedidos recientes</h4>
                        <p className="mt-1 text-sm text-zinc-500">Los nuevos pedidos apareceran aqui automaticamente.</p>
                    </div>
                ) : (
                    visibleOrders.map((order) => (
                        <article
                            key={order.id}
                            className="group rounded-[1.5rem] border border-zinc-100 bg-zinc-50/50 p-3.5 transition-all duration-300 hover:border-zinc-200 hover:bg-zinc-50 md:rounded-[1.75rem] md:border-transparent md:p-4"
                        >
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-200 md:h-14 md:w-14">
                                    <Clock size={14} className="mb-1 text-white/60 md:h-4 md:w-4" />
                                    <span className="text-[0.6rem] font-bold md:text-[0.65rem]">
                                        {format(new Date(order.recibidoEn), "HH:mm")}
                                    </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h4 className="truncate text-sm font-bold text-zinc-900 md:text-base">
                                                {order.clienteNombre || "Cliente General"}
                                            </h4>
                                            <p className="mt-0.5 truncate text-[0.72rem] font-medium text-zinc-400 md:text-xs">
                                                {`${order.items?.length || 0} items • ${order.numero}`}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-sm font-black text-zinc-900 md:text-base">
                                            {formatCurrency(Number(order.total))}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center gap-2">
                                        <Badge className={`rounded-full border-none px-2 py-0 text-[0.6rem] font-black uppercase ${getStatusClasses(order.estado)}`}>
                                            {order.estado}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>

            <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 md:p-6">
                <Link href="/admin/dashboard/pedidos" className="block w-full">
                    <Button className="group h-11 w-full rounded-2xl bg-zinc-900 font-bold text-white shadow-lg shadow-zinc-200 transition-all hover:bg-zinc-800 md:h-12">
                        Gestionar Todos los Pedidos
                        <ChevronRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </div>
        </section>
    );
}
