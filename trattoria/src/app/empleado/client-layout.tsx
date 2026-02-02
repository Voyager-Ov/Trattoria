"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { EmpleadoSidebar } from "@/components/empleado/EmpleadoSidebar";
import { EmpleadoHeader } from "@/components/empleado/EmpleadoHeader";

export default function EmpleadoClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // We can keep useAuth here for user data context, but protection is now server-side
    // This mostly serves as the UI shell now
    const { userData } = useAuth(); // Optional: used for displaying user info if needed

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50/50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <EmpleadoSidebar mode="desktop" />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
                <EmpleadoHeader />

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
