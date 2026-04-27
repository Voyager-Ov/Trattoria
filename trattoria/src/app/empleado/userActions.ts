"use server";

import { prisma } from "@/lib/prisma";
import { getSessionCookie, verifySessionCookie } from "@/lib/auth";

export async function getCurrentEmployeeProfile() {
    try {
        const sessionCookie = await getSessionCookie();

        if (!sessionCookie) {
            return { success: false, error: "No session found" };
        }

        const decodedToken = await verifySessionCookie(sessionCookie);

        if (!decodedToken?.uid) {
            return { success: false, error: "Invalid session" };
        }

        const user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid },
            select: {
                id: true,
                displayName: true,
                email: true,
                rol: true,
                avatarUrl: true,
            },
        });

        if (!user) {
            return { success: false, error: "User not found in database" };
        }

        return { success: true, data: user };
    } catch (error) {
        console.error("Error fetching current employee profile:", error);
        return { success: false, error: "Error al cargar la informacion del usuario" };
    }
}
