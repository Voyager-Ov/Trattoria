"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UnidadMedida, Prisma, DiscountType, ProductCatalogRole, ProductOptionPriceMode } from "@prisma/client";
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

function revalidateProductSurfaces(id?: string) {
    revalidatePath("/admin/dashboard/productos");
    revalidatePath("/empleado/productos");
    revalidatePath("/api/admin/dashboard/productos");
    revalidatePath("/api/productos");
    if (id) {
        revalidatePath(`/admin/dashboard/productos/${id}`);
        revalidatePath(`/api/admin/dashboard/productos/${id}`);
    }
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/");
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

export async function toggleProductActive(id: string, currentStatus: boolean) {
    try {
        await prisma.product.update({
            where: { id },
            data: { activo: !currentStatus },
        });
        revalidateProductSurfaces(id);
        return { success: true };
    } catch (error) {
        console.error("Error toggling product active state:", error);
        return { success: false, error: "Error al cambiar el estado del producto" };
    }
}

export async function softDeleteProduct(id: string) {
    try {
        await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        revalidateProductSurfaces(id);
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

// =============================================================================
// CONFIGURABLE PRODUCTS — Types (T01)
// =============================================================================

export type ConfigurableProductPayload = {
    nombre: string;
    descripcion?: string;
    precio: string | number;
    costoUnitario?: string | number | null;
    categoryId: string;
    imagen?: string | null;
    unidad?: UnidadMedida;
    catalogRole: ProductCatalogRole;
    recipeItems: { supplyId: string; qtyPerUnit: number; unidad: UnidadMedida }[];
    groupAssignments: { groupId: string; orden: number }[];
    optionLinks: { optionId: string; price: number; activo: boolean; orden: number }[];
};

export type ProductOptionGroupWithOptions = Prisma.ProductOptionGroupGetPayload<{
    include: {
        options: true;
        _count: { select: { assignments: true } };
    };
}>;

// =============================================================================
// CONFIGURABLE PRODUCTS — Option Group CRUD (T02, T03, T04)
// =============================================================================

export async function getProductOptionGroups() {
    try {
        const groups = await prisma.productOptionGroup.findMany({
            include: {
                options: {
                    where: { deletedAt: null },
                    orderBy: { orden: "asc" },
                },
                _count: {
                    select: { assignments: true },
                },
            },
            orderBy: { orden: "asc" },
        });
        return { success: true, data: serializePrisma(groups) };
    } catch (error) {
        console.error("Error fetching product option groups:", error);
        return { success: false, error: "Error al obtener los grupos de opciones" };
    }
}

export async function createProductOptionGroup(data: {
    key: string;
    nombre: string;
    priceMode: ProductOptionPriceMode;
    required: boolean;
    orden: number;
}) {
    try {
        const normalizedKey = data.key.trim();
        if (!/^[a-z0-9_]+$/.test(normalizedKey)) {
            return {
                success: false,
                error: "El key debe estar en lowercase y usar solo letras, numeros o '_'",
            };
        }
        const group = await prisma.productOptionGroup.create({
            data: {
                key: normalizedKey,
                nombre: data.nombre,
                priceMode: data.priceMode,
                required: data.required,
                orden: data.orden,
            },
        });
        revalidatePath("/admin/dashboard/productos/opciones");
        return { success: true, data: serializePrisma(group) };
    } catch (error) {
        console.error("Error creating product option group:", error);
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
            return { success: false, error: `Ya existe un grupo con el key '${data.key}'` };
        }
        return { success: false, error: "Error al crear el grupo de opciones" };
    }
}

export async function updateProductOptionGroup(
    id: string,
    data: {
        nombre: string;
        priceMode: ProductOptionPriceMode;
        required: boolean;
        orden: number;
    }
) {
    try {
        // key is immutable — not included in update
        const group = await prisma.productOptionGroup.update({
            where: { id },
            data: {
                nombre: data.nombre,
                priceMode: data.priceMode,
                required: data.required,
                orden: data.orden,
            },
        });
        revalidatePath("/admin/dashboard/productos/opciones");
        return { success: true, data: serializePrisma(group) };
    } catch (error) {
        console.error("Error updating product option group:", error);
        return { success: false, error: "Error al actualizar el grupo de opciones" };
    }
}

export async function deleteProductOptionGroup(id: string) {
    try {
        // Guard: check if group has product assignments
        const group = await prisma.productOptionGroup.findUnique({
            where: { id },
            include: { _count: { select: { assignments: true } } },
        });

        if (!group) {
            return { success: false, error: "Grupo no encontrado" };
        }

        if (group._count.assignments > 0) {
            return {
                success: false,
                error: `No se puede eliminar: el grupo tiene ${group._count.assignments} producto${group._count.assignments === 1 ? "" : "s"} asignado${group._count.assignments === 1 ? "" : "s"}`,
            };
        }

        // Safe to hard delete — cascade will delete options
        await prisma.productOptionGroup.delete({ where: { id } });
        revalidatePath("/admin/dashboard/productos/opciones");
        return { success: true };
    } catch (error) {
        console.error("Error deleting product option group:", error);
        return { success: false, error: "Error al eliminar el grupo de opciones" };
    }
}

// =============================================================================
// CONFIGURABLE PRODUCTS — Option CRUD (T05, T06)
// =============================================================================

export async function createProductOption(
    groupId: string,
    data: {
        label: string;
        slug: string;
        optionProductId?: string | null;
        recipeMultiplier?: number | null;
        activo: boolean;
        orden: number;
    }
) {
    try {
        const option = await prisma.productOption.create({
            data: {
                groupId,
                label: data.label,
                slug: data.slug,
                optionProductId: data.optionProductId || null,
                recipeMultiplier: data.recipeMultiplier ?? null,
                activo: data.activo,
                orden: data.orden,
            },
        });
        revalidatePath("/admin/dashboard/productos/opciones");
        return { success: true, data: serializePrisma(option) };
    } catch (error) {
        console.error("Error creating product option:", error);
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
            return { success: false, error: `Ya existe una opción con el slug '${data.slug}' en este grupo` };
        }
        return { success: false, error: "Error al crear la opción" };
    }
}

export async function updateProductOption(
    id: string,
    data: {
        label: string;
        optionProductId?: string | null;
        recipeMultiplier?: number | null;
        activo: boolean;
        orden: number;
    }
) {
    try {
        // slug is immutable — not included in update
        const option = await prisma.productOption.update({
            where: { id },
            data: {
                label: data.label,
                optionProductId: data.optionProductId || null,
                recipeMultiplier: data.recipeMultiplier ?? null,
                activo: data.activo,
                orden: data.orden,
            },
        });
        revalidatePath("/admin/dashboard/productos/opciones");
        return { success: true, data: serializePrisma(option) };
    } catch (error) {
        console.error("Error updating product option:", error);
        return { success: false, error: "Error al actualizar la opción" };
    }
}

export async function softDeleteProductOption(id: string) {
    try {
        await prisma.productOption.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        revalidatePath("/admin/dashboard/productos/opciones");
        return { success: true };
    } catch (error) {
        console.error("Error soft-deleting product option:", error);
        return { success: false, error: "Error al eliminar la opción" };
    }
}

// =============================================================================
// CONFIGURABLE PRODUCTS — Query Functions (T07, T08)
// =============================================================================

export async function getOptionProductCandidates() {
    try {
        const products = await prisma.product.findMany({
            where: {
                catalogRole: "OPTION_PRODUCT",
                activo: true,
                deletedAt: null,
            },
            select: {
                id: true,
                nombre: true,
            },
            orderBy: { nombre: "asc" },
        });
        return { success: true, data: serializePrisma(products) };
    } catch (error) {
        console.error("Error fetching option product candidates:", error);
        return { success: false, error: "Error al obtener productos vinculables" };
    }
}

export async function getProductWithConfiguration(id: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                recipeItems: {
                    include: {
                        supply: true,
                    },
                },
                optionGroupAssignments: {
                    include: {
                        group: {
                            include: {
                                options: {
                                    where: { deletedAt: null },
                                },
                            },
                        },
                    },
                    orderBy: { orden: "asc" },
                },
                optionLinksAsBase: {
                    include: {
                        option: true,
                    },
                    orderBy: { orden: "asc" },
                },
            },
        });

        if (!product) {
            return { success: false, error: "Producto no encontrado" };
        }

        return { success: true, data: serializePrisma(product) };
    } catch (error) {
        console.error("Error fetching product with configuration:", error);
        return { success: false, error: "Error al obtener el producto con configuración" };
    }
}

// =============================================================================
// CONFIGURABLE PRODUCTS — Create & Update with Transaction (T09, T10)
// =============================================================================

export async function createConfigurableProduct(data: ConfigurableProductPayload) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create product
            const product = await tx.product.create({
                data: {
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    imagen: data.imagen,
                    precio: Number(data.precio),
                    costoUnitario: data.costoUnitario ? Number(data.costoUnitario) : null,
                    categoryId: data.categoryId,
                    unidad: data.unidad || "UNIDAD",
                    catalogRole: data.catalogRole,
                },
            });

            // 2. Create recipe items
            if (data.recipeItems.length > 0) {
                await tx.productRecipeItem.createMany({
                    data: data.recipeItems.map(item => ({
                        productId: product.id,
                        supplyId: item.supplyId,
                        qtyPerUnit: item.qtyPerUnit,
                        unidad: item.unidad,
                    })),
                });
            }

            // 3. Create group assignments
            if (data.groupAssignments.length > 0) {
                await tx.productOptionGroupAssignment.createMany({
                    data: data.groupAssignments.map(a => ({
                        productId: product.id,
                        groupId: a.groupId,
                        orden: a.orden,
                    })),
                });
            }

            // 4. Create option links
            if (data.optionLinks.length > 0) {
                await tx.productOptionLink.createMany({
                    data: data.optionLinks.map(l => ({
                        baseProductId: product.id,
                        optionId: l.optionId,
                        price: l.price,
                        activo: l.activo,
                        orden: l.orden,
                    })),
                });
            }

            return product;
        }, {
            maxWait: 10000,
            timeout: 20000,
        });

        revalidateProductSurfaces(result.id);
        return { success: true, data: { id: result.id } };
    } catch (error) {
        console.error("Error creating configurable product:", error);
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
            return { success: false, error: "Ya existe un producto con ese nombre" };
        }
        return { success: false, error: "Error al crear el producto" };
    }
}

export async function updateConfigurableProduct(id: string, data: ConfigurableProductPayload) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Update product
            await tx.product.update({
                where: { id },
                data: {
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    imagen: data.imagen,
                    precio: Number(data.precio),
                    costoUnitario: data.costoUnitario ? Number(data.costoUnitario) : null,
                    categoryId: data.categoryId,
                    unidad: data.unidad || "UNIDAD",
                    catalogRole: data.catalogRole,
                },
            });

            // 2. Delete & recreate recipe items
            await tx.productRecipeItem.deleteMany({ where: { productId: id } });
            if (data.recipeItems.length > 0) {
                await tx.productRecipeItem.createMany({
                    data: data.recipeItems.map(item => ({
                        productId: id,
                        supplyId: item.supplyId,
                        qtyPerUnit: item.qtyPerUnit,
                        unidad: item.unidad,
                    })),
                });
            }

            // 3. Delete & recreate group assignments
            await tx.productOptionGroupAssignment.deleteMany({ where: { productId: id } });
            if (data.groupAssignments.length > 0) {
                await tx.productOptionGroupAssignment.createMany({
                    data: data.groupAssignments.map(a => ({
                        productId: id,
                        groupId: a.groupId,
                        orden: a.orden,
                    })),
                });
            }

            // 4. Delete & recreate option links
            await tx.productOptionLink.deleteMany({ where: { baseProductId: id } });
            if (data.optionLinks.length > 0) {
                await tx.productOptionLink.createMany({
                    data: data.optionLinks.map(l => ({
                        baseProductId: id,
                        optionId: l.optionId,
                        price: l.price,
                        activo: l.activo,
                        orden: l.orden,
                    })),
                });
            }
        }, {
            maxWait: 10000,
            timeout: 20000,
        });

        revalidateProductSurfaces(id);
        return { success: true };
    } catch (error) {
        console.error("Error updating configurable product:", error);
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
            return { success: false, error: "Ya existe un producto con ese nombre" };
        }
        return { success: false, error: "Error al actualizar el producto" };
    }
}

