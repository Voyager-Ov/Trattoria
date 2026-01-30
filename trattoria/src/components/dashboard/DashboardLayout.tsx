import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
// import { ScrollArea } from "@/components/ui/scroll-area"; // Removed to fix build, using standard overflow

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50/50">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar mode="desktop" />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
                <Header />

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
