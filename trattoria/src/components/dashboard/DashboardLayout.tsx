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

            <SidebarInset className="bg-[#F6F5F2] text-zinc-900">
                <Header />

                <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 md:px-6 md:pb-6 md:pt-6">
                    {children}
                </main>
            </SidebarInset>

            <AdminMobileNav />
        </SidebarProvider>
    )
}
