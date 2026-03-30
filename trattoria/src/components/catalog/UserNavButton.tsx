"use client";
// Componente cliente MÍNIMO: solo el ícono de usuario/login.
// useAuth se llama una sola vez acá, no en todo el header.
import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";

export function UserNavButton() {
    const { userData } = useAuth();

    const href = userData
        ? (userData.rol === "ADMIN" ? "/admin/dashboard" : "/empleado")
        : "/login";

    return (
        <Link href={href}>
            <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full text-white hover:text-[#CB0101] hover:bg-white transition-all shadow-sm"
                aria-label="Mi cuenta"
            >
                <User className="h-6 w-6" />
            </Button>
        </Link>
    );
}
