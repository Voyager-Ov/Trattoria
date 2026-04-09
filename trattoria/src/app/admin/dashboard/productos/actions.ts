"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UnidadMedida, Prisma, DiscountType } from "@prisma/client";
import { serializePrisma } from "@/lib/utils";

type ProductActionData = {
    nombre: string;
    descripcion?: string;
    precio: string | number;
    costoUnitario?: string | number | null;
    categoryId: string;
    imagen?: string | null;
    stockActual?: string | number;
    stockMinimo?: string | number;
    stockMaximo?: string | number;
    unidad?: UnidadMedida;
};

type CategoryCreateData = {
    nombre: string;
    descripcion?: string;
    imagen?: string;
    activo?: boolean;
    esPromocion?: boolean;
    orden?: number;
};

type CategoryUpdateData = {
    nombre?: string;
    descripcion?: string;
    imagen?: string;
    activo?: boolean;
    esPromocion?: boolean;
    orden?: number;
};

export type PromotionActionData = {
    name?: string;
    nombre?: string; // Soportar nombre del UI
    description?: string;
    descripcion?: string; // Soportar descripcion del UI
    discountType?: string;
    discountValue?: string | number;
    precio?: string | number; // Soportar precio del UI (final price)
    daysOfWeek?: string | null;
    imagen?: string | null;
    isActive?: boolean;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    items?: { productId: string; quantity: string | number }[];
    productIds?: string[];
    categoryIds?: string[];
    categoriaPromoId?: string; // Soportar categoria del UI
};

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
                recipeItems: {
                    include: {
                        supply: true
                    }
                }
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
            data: { activo: !currentStatus },
        });
        revalidatePath("/admin/dashboard/productos");
        revalidatePath("/categoria/[slug]", "page");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error toggling product availability:", error);
        return { success: false, error: "Error al cambiar el estado" };
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
        return { success: false, error: "Error al eliminar the producto" };
    }
}

export async function createProduct(data: ProductActionData) {
    try {
        const product = await prisma.product.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                precio: Number(data.precio),
                costoUnitario: data.costoUnitario ? Number(data.costoUnitario) : null,
                categoryId: data.categoryId,
                imagen: data.imagen,
                unidad: data.unidad || "UNIDAD",
                stockActual: Number(data.stockActual) || 0,
                stockMinimo: Number(data.stockMinimo) || 0,
                stockMaximo: Number(data.stockMaximo) || 0,
            },
        });
        revalidatePath("/admin/dashboard/productos");
        return { success: true, data: serializePrisma(product) };
    } catch (error) {
        console.error("Error creating product:", error);
        return { success: false, error: "Error al crear the producto" };
    }
}

export async function createCategory(data: CategoryCreateData) {
    try {
        const slug = data.nombre
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const category = await prisma.category.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                imagen: data.imagen,
                activo: data.activo,
                esPromocion: data.esPromocion,
                orden: data.orden,
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
export async function updateProduct(id: string, data: ProductActionData) {
    try {
        const product = await prisma.product.update({
            where: { id },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                precio: Number(data.precio),
                costoUnitario: data.costoUnitario ? Number(data.costoUnitario) : null,
                categoryId: data.categoryId,
                imagen: data.imagen,
                unidad: data.unidad || "UNIDAD",
                stockActual: Number(data.stockActual) || 0,
                stockMinimo: Number(data.stockMinimo) || 0,
                stockMaximo: Number(data.stockMaximo) || 0,
            },
        });
        revalidatePath("/admin/dashboard/productos");
        return { success: true, data: serializePrisma(product) };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, error: "Error al actualizar the producto" };
    }
}
export async function createPromotion(data: PromotionActionData) {
    try {
        // Alíasing de campos del UI si es necesario
        const name = data.name || data.nombre || "";
        const description = data.description || data.descripcion || "";
        const discountType = (data.discountType as DiscountType) || DiscountType.FIXED_AMOUNT;

        // Si el UI manda 'precio' (precio final), pero necesitamos 'discountValue' (ahorro)
        // en esta versión asumimos que si no viene discountValue, el UI ya hizo el cálculo
        // o que 'discountValue' es lo que queremos guardar.
        // Pero para ser compatibles con el UI actual:
        const discountValue = Number(data.discountValue || 0);

        // Si no viene discountValue pero si precio, intentamos usarlo si el tipo es FIXED_AMOUNT 
        // (Aunque lo ideal es que el UI mande el ahorro directamente)
        if (!data.discountValue && data.precio) {
            // Nota: Aquí no sabemos el total original, así que el UI DEBE mandar el ahorro en discountValue
            // o el backend debería calcularlo. Por ahora, si viene discountValue lo usamos.
            // Si el UI manda 'precio', lo usaremos como discountValue solo si es lo que se espera.
            // PERO: El UI de CreatePromotionSheet manda 'precio' queriendo decir 'precio final'.
            // Vamos a dejar que el UI mande discountValue calculado.
        }

        const promotionData: Prisma.PromotionCreateInput = {
            name,
            description,
            discountType,
            discountValue,
            daysOfWeek: data.daysOfWeek || null,
            imagen: data.imagen || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
        };

        // Handle optional dates
        if (data.startDate && typeof data.startDate === 'string' && data.startDate.trim() !== "") {
            const parsedStart = new Date(data.startDate);
            if (!isNaN(parsedStart.getTime())) promotionData.startDate = parsedStart;
        }

        if (data.endDate && typeof data.endDate === 'string' && data.endDate.trim() !== "") {
            const parsedEnd = new Date(data.endDate);
            if (!isNaN(parsedEnd.getTime())) promotionData.endDate = parsedEnd;
        }

        // Build relations from items and productIds
        const itemsToCreate = [...(data.items || [])];
        if (data.productIds && Array.isArray(data.productIds)) {
            data.productIds.forEach(pid => {
                if (!itemsToCreate.find(i => i.productId === pid)) {
                    itemsToCreate.push({ productId: pid, quantity: 1 });
                }
            });
        }

        if (itemsToCreate.length > 0) {
            promotionData.items = {
                create: itemsToCreate.map((item) => ({
                    productId: item.productId,
                    quantity: Number(item.quantity) || 1
                }))
            };
        }

        // Combine categoryIds and categoriaPromoId
        const catIds = [...(data.categoryIds || [])];
        if (data.categoriaPromoId && !catIds.includes(data.categoriaPromoId)) {
            catIds.push(data.categoriaPromoId);
        }

        if (catIds.length > 0) {
            promotionData.categories = {
                connect: catIds.map((id) => ({ id }))
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
        revalidatePath("/admin/dashboard/productos/promociones");
        return { success: true, data: serializePrisma(promotion) };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error al crear la promoción";
        console.error("Error creating promotion:", error);
        return { success: false, error: message };
    }
}

export async function getPromotionById(id: string) {
    try {
        const promotion = await prisma.promotion.findUnique({
            where: { id, deletedAt: null },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                recipeItems: {
                                    include: {
                                        supply: true
                                    }
                                }
                            }
                        }
                    }
                },
                categories: true
            }
        });

        if (!promotion) {
            return { success: false, error: "Promoción no encontrada" };
        }

        return { success: true, data: serializePrisma(promotion) };
    } catch (error) {
        console.error("Error fetching promotion:", error);
        return { success: false, error: "Error al obtener la promoción" };
    }
}

export async function updatePromotion(id: string, data: PromotionActionData) {
    try {
        const name = data.name || data.nombre || "";
        const description = data.description || data.descripcion || "";
        const discountType = (data.discountType as DiscountType) || DiscountType.FIXED_AMOUNT;
        const discountValue = Number(data.discountValue || 0);

        const promotionUpdateData: Prisma.PromotionUpdateInput = {
            name,
            description,
            discountType,
            discountValue,
            daysOfWeek: data.daysOfWeek || null,
            imagen: data.imagen || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
        };

        if (data.startDate) promotionUpdateData.startDate = new Date(data.startDate);
        if (data.endDate) promotionUpdateData.endDate = new Date(data.endDate);

        // Build relations from items and productIds
        const itemsToCreate = [...(data.items || [])];
        if (data.productIds && Array.isArray(data.productIds)) {
            data.productIds.forEach(pid => {
                if (!itemsToCreate.find(i => i.productId === pid)) {
                    itemsToCreate.push({ productId: pid, quantity: 1 });
                }
            });
        }

        // Combine categoryIds and categoriaPromoId
        const catIds = [...(data.categoryIds || [])];
        if (data.categoriaPromoId && !catIds.includes(data.categoriaPromoId)) {
            catIds.push(data.categoriaPromoId);
        }

        // Update with transaction to handle relations
        const promotion = await prisma.$transaction(async (tx) => {
            // Clear existing relations
            await tx.promotionProduct.deleteMany({ where: { promotionId: id } });

            // Update the promotion
            return await tx.promotion.update({
                where: { id },
                data: {
                    ...promotionUpdateData,
                    items: {
                        create: itemsToCreate.map((item) => ({
                            productId: item.productId,
                            quantity: Number(item.quantity) || 1
                        }))
                    },
                    categories: {
                        set: catIds.map((catId: string) => ({ id: catId }))
                    }
                },
                include: {
                    items: true,
                    categories: true
                }
            });
        });

        revalidatePath("/admin/dashboard/productos");
        revalidatePath("/admin/dashboard/productos/promociones");
        revalidatePath(`/admin/dashboard/productos/promociones/${id}`);
        return { success: true, data: serializePrisma(promotion) };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error al actualizar la promoción";
        console.error("Error updating promotion:", error);
        return { success: false, error: message };
    }
}

export async function deletePromotion(id: string) {
    try {
        await prisma.promotion.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        revalidatePath("/admin/dashboard/productos");
        revalidatePath("/admin/dashboard/productos/promociones");
        return { success: true };
    } catch (error) {
        console.error("Error deleting promotion:", error);
        return { success: false, error: "Error al eliminar la promoción" };
    }
}
export async function updateCategory(id: string, data: CategoryUpdateData) {
    try {
        const category = await prisma.category.update({
            where: { id },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                imagen: data.imagen,
                activo: data.activo,
                esPromocion: data.esPromocion,
                orden: data.orden,
            },
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

export async function createProductWithRecipe(productData: ProductActionData, recipeItems: { supplyId: string; qtyPerUnit: number; unidad: UnidadMedida }[]) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create product
            const product = await tx.product.create({
                data: {
                    nombre: productData.nombre,
                    descripcion: productData.descripcion,
                    imagen: productData.imagen,
                    precio: Number(productData.precio),
                    costoUnitario: productData.costoUnitario ? Number(productData.costoUnitario) : null,
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
    } catch (error) {
        console.error("Error creating product with recipe:", error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return { success: false, error: "Ya existe un producto con ese nombre" };
        return { success: false, error: "Error al crear the producto" };
    }
}

export async function updateProductWithRecipe(id: string, productData: ProductActionData, recipeItems: { supplyId: string; qtyPerUnit: number; unidad: UnidadMedida }[]) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Update product
            const product = await tx.product.update({
                where: { id },
                data: {
                    nombre: productData.nombre,
                    descripcion: productData.descripcion,
                    imagen: productData.imagen,
                    precio: Number(productData.precio),
                    costoUnitario: productData.costoUnitario ? Number(productData.costoUnitario) : null,
                    categoryId: productData.categoryId,
                    unidad: productData.unidad || "UNIDAD",
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
        return { success: false, error: "Error al actualizar the producto" };
    }
}
