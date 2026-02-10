import React from "react";

export function ComingSoonOverlay({ children }: { children?: React.ReactNode }) {
    return (
        <div className="relative min-h-screen">
            {/* Contenido normal (sin difuminar) */}
            <div className="w-full h-full">
                {children}
            </div>

            {/* Overlay con blur - se pone encima */}
            <div className="absolute inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center">
                <div className="bg-white/90 px-12 py-6 rounded-2xl shadow-lg border border-zinc-200">
                    <h1 className="text-4xl font-bold text-zinc-800">
                        Próximamente
                    </h1>
                </div>
            </div>
        </div>
    );
}

