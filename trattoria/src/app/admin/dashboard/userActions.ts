"use server";

import { prisma } from "@/lib/prisma";
import { getSessionCookie, verifySessionCookie } from "@/lib/auth";

/**
 * Fetch the current user's profile information for the header
 */
export async function getCurrentUserProfile() {
    try {
        const sessionCookie = await getSessionCookie();

        if (!sessionCookie) {
            return { success: false, error: "No session found" };
        }

        const decodedToken = await verifySessionCookie(sessionCookie);

        if (!decodedToken || !decodedToken.uid) {
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
            }
        });

        if (!user) {
            return { success: false, error: "User not found in database" };
        }

        return {
            success: true,
            data: user
        };
    } catch (error) {
        console.error("Error fetching current user profile:", error);
        return { success: false, error: "Error al cargar la información del usuario" };
    }
}
