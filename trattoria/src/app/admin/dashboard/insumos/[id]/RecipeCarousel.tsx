"use client";

import { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type RecipeItem = {
    id: string;
    qtyPerUnit: number;
    unidad: string;
    product: { id: string; nombre: string; precio?: number | null; activo: boolean };
};

export function RecipeCarousel({ items }: { items: RecipeItem[] }) {
    const trackRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const posRef = useRef(0);
    const isHovering = useRef(false);

    const clampAndAnimate = useCallback((delta: number) => {
        const track = trackRef.current;
        const container = containerRef.current;
        if (!track || !container) return;

        const maxScroll = track.scrollWidth - container.clientWidth;
        if (maxScroll <= 0) return;

        posRef.current = Math.max(0, Math.min(posRef.current + delta, maxScroll));

        gsap.to(track, {
            x: -posRef.current,
            duration: 0.5,
            ease: "power2.out",
            overwrite: true,
        });
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || items.length === 0) return;

        const onWheel = (e: WheelEvent) => {
            if (!isHovering.current) return;

            const track = trackRef.current;
            if (!track) return;
            const maxScroll = track.scrollWidth - container.clientWidth;
            if (maxScroll <= 0) return;

            // Prevent vertical page scroll
            e.preventDefault();
            e.stopPropagation();

            // Use deltaY (vertical wheel) as horizontal movement
            const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
            clampAndAnimate(delta);
        };

        // Must be { passive: false } to allow preventDefault
        container.addEventListener("wheel", onWheel, { passive: false });
        return () => container.removeEventListener("wheel", onWheel);
    }, [items, clampAndAnimate]);

    const handleEnter = () => { isHovering.current = true; };
    const handleLeave = () => { isHovering.current = false; };

    if (items.length === 0) {
        return (
            <p className="px-6 py-6 text-sm font-medium text-zinc-400 italic">
                Ningún producto usa este insumo en su receta.
            </p>
        );
    }

    return (
        <div
            ref={containerRef}
            className="overflow-hidden px-6 pb-5"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <div ref={trackRef} className="flex gap-3 will-change-transform">
                {items.map((ri) => (
                    <div
                        key={ri.id}
                        className="flex min-w-[200px] shrink-0 items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-200/70">
                            <ShoppingCart className="h-4 w-4 text-zinc-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-zinc-900">{ri.product.nombre}</p>
                            <p className="text-[11px] font-medium text-zinc-500">
                                {Number(ri.qtyPerUnit).toFixed(3)} {ri.unidad.toLowerCase()} / ud
                            </p>
                        </div>
                        {!ri.product.activo && (
                            <Badge variant="secondary" className="shrink-0 text-[10px]">Inactivo</Badge>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
