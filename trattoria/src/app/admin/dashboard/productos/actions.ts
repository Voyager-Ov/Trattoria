"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UnidadMedida } from "@prisma/client";
import { serializePrisma } from "@/lib/utils";

export async function getCategories() {
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
        console.error("Error fetching categories:", error);
        return { success: false, error: "Error al obtener las categorías" };
    }
}

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            where: {
                deletedAt: null,
            },
            include: {
                category: true,
            },
            orderBy: {
                nombre: "asc",
            },
        });
        return { success: true, data: serializePrisma(products) };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { success: false, error: "Error al obtener los productos" };
    }
}

export async function getProductById(id: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                recipeItems: {
                    include: {
                        supply: true
                    }
                }
            }
        });

        if (!product) {
            return { success: false, error: "Producto no encontrado" };
        }

        return { success: true, data: serializePrisma(product) };
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        return { success: false, error: "Error al obtener el producto" };
    }
}

export async function toggleProductAvailability(id: string, currentStatus: boolean) {
    try {
        await prisma.product.update({
            where: { id },
            data: { disponible: !currentStatus },
        });
        revalidatePath("/admin/dashboard/productos");
        return { success: true };
    } catch (error) {
        console.error("Error toggling product availability:", error);
        return { success: false, error: "Error al cambiar la disponibilidad" };
    }
}

export async function softDeleteProduct(id: string) {
    try {
        await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        revalidatePath("/admin/dashboard/productos");
        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, error: "Error al eliminar el producto" };
    }
}

export async function createProduct(data: any) {
    try {
        const product = await prisma.product.create({
            data: {
                ...data,
                precio: parseFloat(data.precio),
                costoUnitario: data.costoUnitario ? parseFloat(data.costoUnitario) : null,
                stockActual: parseInt(data.stockActual) || 0,
                stockMinimo: parseInt(data.stockMinimo) || 0,
                stockMaximo: parseInt(data.stockMaximo) || 0,
            },
        });
        revalidatePath("/admin/dashboard/productos");
        return { success: true, data: serializePrisma(product) };
    } catch (error) {
        console.error("Error creating product:", error);
        return { success: false, error: "Error al crear el producto" };
    }
}

export async function createCategory(data: any) {
    try {
        const slug = data.nombre
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const category = await prisma.category.create({
            data: {
                ...data,
                slug,
            },
        });
        revalidatePath("/admin/dashboard/productos");
        revalidatePath("/admin/dashboard/productos/categorias");
        return { success: true, data: serializePrisma(category) };
    } catch (error) {
        console.error("Error creating category:", error);
        return { success: false, error: "Error al crear la categoría" };
    }
}
export async function updateProduct(id: string, data: any) {
    try {
        const product = await prisma.product.update({
            where: { id },
            data: {
                ...data,
                precio: parseFloat(data.precio),
                costoUnitario: data.costoUnitario ? parseFloat(data.costoUnitario) : null,
                stockActual: parseInt(data.stockActual) || 0,
                stockMinimo: parseInt(data.stockMinimo) || 0,
                stockMaximo: parseInt(data.stockMaximo) || 0,
            },
        });
        revalidatePath("/admin/dashboard/productos");
        return { success: true, data: serializePrisma(product) };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, error: "Error al actualizar el producto" };
    }
}
export async function createPromotion(data: any) {
    try {
        const promotionData: any = {
            name: data.name,
            description: data.description || "",
            discountType: data.discountType,
            discountValue: parseFloat(data.discountValue),
            daysOfWeek: data.daysOfWeek || null,
            imagen: data.imagen || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
        };

        // Handle optional dates carefully
        if (data.startDate && typeof data.startDate === 'string' && data.startDate.trim() !== "") {
            const parsedStart = new Date(data.startDate);
            if (!isNaN(parsedStart.getTime())) {
                promotionData.startDate = parsedStart;
            }
        }

        if (data.endDate && typeof data.endDate === 'string' && data.endDate.trim() !== "") {
            const parsedEnd = new Date(data.endDate);
            if (!isNaN(parsedEnd.getTime())) {
                promotionData.endDate = parsedEnd;
            }
        }

        // Build relations
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            promotionData.items = {
                create: data.items.map((item: any) => ({
                    productId: item.productId,
                    quantity: parseInt(item.quantity) || 1
                }))
            };
        }

        if (data.categoryIds && Array.isArray(data.categoryIds) && data.categoryIds.length > 0) {
            promotionData.categories = {
                connect: data.categoryIds.map((id: string) => ({ id }))
            };
        }

        const promotion = await prisma.promotion.create({
            data: promotionData,
            include: {
                items: true,
                categories: true
            }
        });

        revalidatePath("/admin/dashboard/productos");
        return { success: true, data: serializePrisma(promotion) };
    } catch (error: any) {
        console.error("Error creating promotion:", error);
        return { success: false, error: error.message || "Error al crear la promoción" };
    }
}
export async function updateCategory(id: string, data: any) {
    try {
        const category = await prisma.category.update({
            where: { id },
            data,
        });
        revalidatePath("/admin/dashboard/productos");
        revalidatePath("/admin/dashboard/productos/categorias");
        return { success: true, data: serializePrisma(category) };
    } catch (error) {
        console.error("Error updating category:", error);
        return { success: false, error: "Error al actualizar la categoría" };
    }
}

export async function softDeleteCategory(id: string) {
    try {
        // Check if there are active products in this category
        const productsCount = await prisma.product.count({
            where: {
                categoryId: id,
                deletedAt: null
            }
        });

        if (productsCount > 0) {
            return {
                success: false,
                error: "No se puede eliminar la categoría porque tiene productos asociados"
            };
        }

        await prisma.category.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        revalidatePath("/admin/dashboard/productos");
        revalidatePath("/admin/dashboard/productos/categorias");
        return { success: true };
    } catch (error) {
        console.error("Error deleting category:", error);
        return { success: false, error: "Error al eliminar la categoría" };
    }
}

export async function reorderCategories(orders: { id: string; orden: number }[]) {
    try {
        await prisma.$transaction(
            orders.map((item) =>
                prisma.category.update({
                    where: { id: item.id },
                    data: { orden: item.orden },
                })
            )
        );
        revalidatePath("/admin/dashboard/productos");
        revalidatePath("/admin/dashboard/productos/categorias");
        return { success: true };
    } catch (error) {
        console.error("Error reordering categories:", error);
        return { success: false, error: "Error al reordenar las categorías" };
    }
}

export async function getSupplies() {
    try {
        const supplies = await prisma.supply.findMany({
            where: {
                deletedAt: null,
                activo: true,
            },
            orderBy: {
                nombre: "asc",
            },
        });
        return { success: true, data: serializePrisma(supplies) };
    } catch (error) {
        console.error("Error fetching supplies:", error);
        return { success: false, error: "Error al obtener los insumos" };
    }
}

export async function createProductWithRecipe(productData: any, recipeItems: { supplyId: string; qtyPerUnit: number; unidad: UnidadMedida }[]) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create product
            const product = await tx.product.create({
                data: {
                    nombre: productData.nombre,
                    descripcion: productData.descripcion,
                    imagen: productData.imagen,
                    precio: parseFloat(productData.precio),
                    costoUnitario: productData.costoUnitario ? parseFloat(productData.costoUnitario) : null,
                    categoryId: productData.categoryId,
                    unidad: productData.unidad || "UNIDAD",
                },
            });

            // Create recipe items
            if (recipeItems.length > 0) {
                await tx.productRecipeItem.createMany({
                    data: recipeItems.map(item => ({
                        productId: product.id,
                        supplyId: item.supplyId,
                        qtyPerUnit: item.qtyPerUnit,
                        unidad: item.unidad,
                    })),
                });
            }

            return product;
        }, {
            maxWait: 10000,
            timeout: 20000,
        });

        revalidatePath("/admin/dashboard/productos");
        return { success: true, data: serializePrisma(result) };
    } catch (error: any) {
        console.error("Error creating product with recipe:", error);
        if (error.code === 'P2002') return { success: false, error: "Ya existe un producto con ese nombre" };
        return { success: false, error: "Error al crear el producto" };
    }
}

export async function updateProductWithRecipe(id: string, productData: any, recipeItems: { supplyId: string; qtyPerUnit: number; unidad: UnidadMedida }[]) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Update product
            const product = await tx.product.update({
                where: { id },
                data: {
                    nombre: productData.nombre,
                    descripcion: productData.descripcion,
                    imagen: productData.imagen,
                    precio: parseFloat(productData.precio),
                    costoUnitario: productData.costoUnitario ? parseFloat(productData.costoUnitario) : null,
                    categoryId: productData.categoryId,
                    unidad: productData.unidad,
                },
            });

            // Delete old recipe items
            await tx.productRecipeItem.deleteMany({
                where: { productId: id },
            });

            // Create new recipe items
            if (recipeItems.length > 0) {
                await tx.productRecipeItem.createMany({
                    data: recipeItems.map(item => ({
                        productId: id,
                        supplyId: item.supplyId,
                        qtyPerUnit: item.qtyPerUnit,
                        unidad: item.unidad,
                    })),
                });
            }

            return product;
        }, {
            maxWait: 10000,
            timeout: 20000,
        });

        revalidatePath("/admin/dashboard/productos");
        return { success: true, data: serializePrisma(result) };
    } catch (error) {
        console.error("Error updating product with recipe:", error);
        return { success: false, error: "Error al actualizar el producto" };
    }
}
