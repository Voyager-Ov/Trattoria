import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getAuthenticatedUserServer } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthenticatedUserServer();

    if (!user) {
        // Strict: If verifying server-side fails (no cookie OR no DB user), force logout
        redirect("/api/auth/logout");
    }

    if (user.rol !== 'ADMIN') {
        console.log(`[Admin Layout] Unauthorized access attempt by ${user.rol}`);
        if (user.rol === 'EMPLEADO') {
            redirect("/empleado");
        } else {
            redirect("/api/auth/logout");
        }
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
