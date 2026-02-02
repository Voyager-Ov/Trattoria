"use server";
// Force recompile to fix stale prisma reference

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";
import { Rol, EstadoUsuario } from "@prisma/client";

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return { success: true, data: serializePrisma(users) };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { success: false, error: "Error al obtener los usuarios" };
    }
}

export async function toggleUserStatus(id: string, currentStatus: EstadoUsuario) {
    try {
        const newStatus: EstadoUsuario = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        await prisma.user.update({
            where: { id },
            data: { estado: newStatus },
        });
        revalidatePath("/admin/dashboard/usuarios");
        return { success: true };
    } catch (error) {
        console.error("Error toggling user status:", error);
        return { success: false, error: "Error al cambiar el estado del usuario" };
    }
}

export async function updateUserRole(id: string, role: Rol) {
    try {
        await prisma.user.update({
            where: { id },
            data: { rol: role },
        });
        revalidatePath("/admin/dashboard/usuarios");
        return { success: true };
    } catch (error) {
        console.error("Error updating user role:", error);
        return { success: false, error: "Error al actualizar el rol del usuario" };
    }
}
import { adminAuth } from "@/lib/firebase-admin";

export async function createEmployee(data: {
    displayName: string;
    email: string;
    password: string;
    rol: Rol;
    estado: EstadoUsuario;
}) {
    try {
        // 1. Create user in Firebase
        const firebaseUser = await adminAuth.createUser({
            email: data.email,
            password: data.password,
            displayName: data.displayName,
        });

        // 2. Set custom claims for role
        await adminAuth.setCustomUserClaims(firebaseUser.uid, {
            rol: data.rol,
        });

        // 3. Create user in Prisma
        const newUser = await prisma.user.create({
            data: {
                firebaseUid: firebaseUser.uid,
                email: data.email,
                displayName: data.displayName,
                rol: data.rol,
                estado: data.estado,
            },
        });

        revalidatePath("/admin/dashboard/usuarios");
        return { success: true, data: serializePrisma(newUser) };
    } catch (error: any) {
        console.error("Error creating employee:", error);

        // Handle Firebase specific errors
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: "El correo electrónico ya está en uso" };
        }

        return { success: false, error: error.message || "Error al crear el empleado" };
    }
}
