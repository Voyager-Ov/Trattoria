"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function deleteSupplyCategory(id: string) {
    try {
        const category = await prisma.supplyCategory.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        supplies: true,
                    },
                },
            },
        });

        if (!category) {
            return { success: false, error: "La categoria no existe" };
        }

        if (category._count.supplies > 0) {
            return { success: false, error: "No se puede eliminar una categoria que todavia tiene insumos asociados" };
        }

        await prisma.supplyCategory.delete({
            where: { id },
        });

        revalidatePath("/admin/dashboard/insumos");
        revalidatePath("/admin/dashboard/insumos/nuevo");
        revalidatePath("/admin/dashboard/insumos/stock");
        return { success: true };
    } catch (error) {
        console.error("Error deleting supply category:", error);
        return { success: false, error: "Error al eliminar la categoria" };
    }
}
