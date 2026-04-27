"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

import { formatSystemClock, SYSTEM_TIME_LOCATION_LABEL } from "@/lib/system-time";

export function SystemTimeBadge() {
    const [clockLabel, setClockLabel] = useState("--:--:--");

    useEffect(() => {
        const tick = () => setClockLabel(formatSystemClock(new Date()));
        tick();

        const timer = window.setInterval(tick, 1000);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-right shadow-sm md:flex">
            <Clock3 className="h-4 w-4 text-zinc-500" />
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Hora sistema</p>
                <p className="text-sm font-bold leading-none text-zinc-900">{clockLabel}</p>
                <p className="text-[10px] text-zinc-500">{SYSTEM_TIME_LOCATION_LABEL}</p>
            </div>
        </div>
    );
}
