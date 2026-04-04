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
                <Header />

                <main className="app-shell-main">
                    {children}
                </main>
            </SidebarInset>

            <AdminMobileNav />
        </SidebarProvider>
    )
}
