import { getAuthenticatedUserServer } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmpleadoClientLayout from "./client-layout";

export default async function EmpleadoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthenticatedUserServer();

    if (!user) {
        // Strict: If verifying server-side fails (no cookie OR no DB user), force logout
        redirect("/api/auth/logout");
    }

    if (user.rol !== 'EMPLEADO') {
        console.log(`[Employee Layout] Unauthorized access attempt by ${user.rol}`);
        if (user.rol === 'ADMIN') {
            redirect("/admin/dashboard");
        } else {
            redirect("/api/auth/logout");
        }
    }

    return <EmpleadoClientLayout>{children}</EmpleadoClientLayout>;
}
