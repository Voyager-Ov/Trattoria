import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Header } from "./Header"
import { AdminMobileNav } from "./AdminMobileNav"
import { AdminSidebar } from "./Sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider defaultOpen>
            <AdminSidebar />

            <SidebarInset className="app-shell-surface">
                <div className="app-shell-panel">
                    <Header />

                    <main className="app-shell-main">
                        {children}
                    </main>
                </div>
            </SidebarInset>

            <AdminMobileNav />
        </SidebarProvider>
    )
}
