import { Calendar } from "lucide-react";

interface DashboardHeroProps {
    currentDateLabel: string;
}

export function DashboardHero({ currentDateLabel }: DashboardHeroProps) {
    return (
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1.5">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-zinc-400 md:hidden">Dashboard</p>
                <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-[2.35rem] md:text-4xl">
                    Panel de Control
                </h1>
                <p className="max-w-2xl text-sm text-zinc-500 sm:text-base md:text-lg">
                    Resumen operativo y financiero de hoy.
                </p>
            </div>

            <div className="flex w-full items-center gap-3 rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:w-auto md:rounded-2xl md:p-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
                    <Calendar size={18} />
                </div>
                <div className="min-w-0">
                    <p className="text-[0.6rem] font-black uppercase tracking-[0.22em] text-zinc-400">Hoy</p>
                    <p className="truncate text-sm font-bold text-zinc-900 sm:text-base">{currentDateLabel}</p>
                </div>
            </div>
        </section>
    );
}
