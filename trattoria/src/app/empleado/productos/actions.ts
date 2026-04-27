"use server";

import { type UnidadMedida } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/serverAuth";
import { serializePrisma } from "@/lib/utils";

type EmployeeProductUpdateData = {
    nombre: string;
    descripcion?: string;
    categoryId: string;
    imagen?: string | null;
};

type EmployeePromotionUpdateData = {
    name: string;
    description?: string;
    imagen?: string | null;
    categoryIds: string[];
};

function revalidateEmployeeMenuSurfaces(id?: string) {
    revalidatePath("/empleado/productos");
    revalidatePath("/api/admin/dashboard/productos");
    revalidatePath("/api/productos");
    revalidatePath("/");
    revalidatePath("/categoria/[slug]", "page");

    if (id) {
        revalidatePath(`/empleado/productos/${id}/editar`);
        revalidatePath(`/empleado/productos/promociones/${id}/editar`);
    }
}

export async function getEmployeeProductCategories() {
    await requireEmployee();

    try {
        const categories = await prisma.category.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: {
                orden: "asc",
            },
        });

        return { success: true, data: serializePrisma(categories) };
    } catch (error) {
        console.error("Error fetching employee categories:", error);
        return { success: false, error: "Error al obtener las categorias" };
    }
}

export async function getEmployeeProductById(id: string) {
    await requireEmployee();

    try {
        const product = await prisma.product.findUnique({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                category: true,
                recipeItems: {
                    include: {
                        supply: true,
                    },
                },
            },
        });

        if (!product) {
            return { success: false, error: "Producto no encontrado" };
        }

        return { success: true, data: serializePrisma(product) };
    } catch (error) {
        console.error("Error fetching employee product:", error);
        return { success: false, error: "Error al obtener el producto" };
    }
}

export async function updateEmployeeProductBasics(id: string, data: EmployeeProductUpdateData) {
    await requireEmployee();

    try {
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                categoryId: data.categoryId,
                imagen: data.imagen ?? null,
            },
        });

        revalidateEmployeeMenuSurfaces(id);
        return { success: true, data: serializePrisma(updatedProduct) };
    } catch (error) {
        console.error("Error updating employee product:", error);
        return { success: false, error: "Error al actualizar el producto" };
    }
}

export async function getEmployeePromotionById(id: string) {
    await requireEmployee();

    try {
        const promotion = await prisma.promotion.findUnique({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                categories: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!promotion) {
            return { success: false, error: "Promocion no encontrada" };
        }

        return { success: true, data: serializePrisma(promotion) };
    } catch (error) {
        console.error("Error fetching employee promotion:", error);
        return { success: false, error: "Error al obtener la promocion" };
    }
}

export async function updateEmployeePromotionBasics(id: string, data: EmployeePromotionUpdateData) {
    await requireEmployee();

    try {
        const updatedPromotion = await prisma.promotion.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                imagen: data.imagen ?? null,
                categories: {
                    set: data.categoryIds.map((categoryId) => ({ id: categoryId })),
                },
            },
            include: {
                categories: true,
            },
        });

        revalidateEmployeeMenuSurfaces(id);
        return { success: true, data: serializePrisma(updatedPromotion) };
    } catch (error) {
        console.error("Error updating employee promotion:", error);
        return { success: false, error: "Error al actualizar la promocion" };
    }
}

export async function toggleEmployeeProductAvailability(id: string, currentStatus: boolean) {
    await requireEmployee();

    try {
        await prisma.product.update({
            where: { id },
            data: {
                disponible: !currentStatus,
            },
        });

        revalidateEmployeeMenuSurfaces(id);
        return { success: true };
    } catch (error) {
        console.error("Error toggling employee product availability:", error);
        return { success: false, error: "Error al cambiar la disponibilidad" };
    }
}

export async function toggleEmployeeMenuItemActive(
    id: string,
    type: "PRODUCTO" | "PROMOCION",
    currentStatus: boolean
) {
    await requireEmployee();

    try {
        if (type === "PRODUCTO") {
            await prisma.product.update({
                where: { id },
                data: {
                    activo: !currentStatus,
                },
            });
        } else {
            await prisma.promotion.update({
                where: { id },
                data: {
                    isActive: !currentStatus,
                },
            });
        }

        revalidateEmployeeMenuSurfaces(id);
        return { success: true };
    } catch (error) {
        console.error("Error toggling employee menu item status:", error);
        return { success: false, error: "Error al cambiar el estado del item" };
    }
}

export type EmployeeRecipeItem = {
    supplyId: string;
    qtyPerUnit: number;
    unidad: UnidadMedida;
};
