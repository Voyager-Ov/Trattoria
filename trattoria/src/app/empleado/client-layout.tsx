"use client";

import { EmpleadoSidebar } from "@/components/empleado/EmpleadoSidebar";
import { EmpleadoHeader } from "@/components/empleado/EmpleadoHeader";
import { EmployeeMobileNav } from "@/components/empleado/EmployeeMobileNav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function EmpleadoClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider defaultOpen>
            <EmpleadoSidebar />

            <SidebarInset className="app-shell-surface">
                <div className="app-shell-panel">
                    <EmpleadoHeader />

                    <main className="app-shell-main">
                        {children}
                    </main>
                </div>
            </SidebarInset>

            <EmployeeMobileNav />
        </SidebarProvider>
    );
}
