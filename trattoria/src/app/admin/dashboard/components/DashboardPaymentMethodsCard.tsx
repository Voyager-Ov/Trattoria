import { CreditCard } from "lucide-react";

import { formatCurrency } from "@/lib/utils";

interface PaymentMethodItem {
    methodId: string;
    label: string;
    amount: number;
    count: number;
}

interface DashboardPaymentMethodsCardProps {
    loading: boolean;
    paymentMethods: PaymentMethodItem[];
}

export function DashboardPaymentMethodsCard({
    loading,
    paymentMethods,
}: DashboardPaymentMethodsCardProps) {
    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className="border-b border-zinc-100 px-4 py-4 md:px-6 md:py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-900">Ingresos por metodo</h3>
                        <p className="mt-1 text-sm text-zinc-500">Cobros del dia agrupados por canal de pago.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-4 md:p-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="animate-pulse rounded-[1.25rem] bg-zinc-50 p-4">
                            <div className="h-4 w-28 rounded bg-zinc-100" />
                            <div className="mt-3 h-3 rounded-full bg-zinc-100" />
                        </div>
                    ))
                ) : paymentMethods.length === 0 ? (
                    <div className="rounded-[1.25rem] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-zinc-600">Todavia no hay cobros registrados hoy.</p>
                    </div>
                ) : (
                    paymentMethods.map((item) => {
                        const maxAmount = Math.max(...paymentMethods.map((method) => method.amount), 1);
                        const width = Math.max(8, (item.amount / maxAmount) * 100);

                        return (
                            <div key={item.methodId} className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50/70 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-zinc-900">{item.label}</p>
                                        <p className="text-xs text-zinc-500">{item.count} operaciones</p>
                                    </div>
                                    <span className="shrink-0 text-sm font-black text-zinc-900">
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>

                                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200">
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{ width: `${width}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
