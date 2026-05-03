"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Search,
    Plus,
    Minus,
    Trash2,
    Save,
    UserPlus,
    ShoppingBag,
    Loader2,
    Check,
    ChevronDown,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { searchCustomers, createOrder, getAdminCatalog } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PublicCatalogProduct } from "@/lib/catalog-config";

interface CartItem {
    id: string;
    productId: string;
    nombre: string;
    cantidad: number;
    precio: number;
    type: 'PRODUCTO' | 'PROMOCION';
    options?: { 
        groupId: string; 
        groupLabel: string; 
        optionId: string; 
        optionLabel: string; 
        priceDelta: number;
        recipeMultiplier?: number | null;
        optionProductId?: string | null;
    }[];
}

interface Customer {
    id: string;
    nombre: string;
    telefono?: string;
    email?: string;
}

interface Category {
    id: string;
    nombre: string;
    slug: string;
}

type AdminCatalogProduct = PublicCatalogProduct & {
    type: 'PRODUCTO' | 'PROMOCION';
    categoriaId: string;
    categoriaNombre: string;
    categoriaSlug?: string;
    categoryIds?: string[];
    orden?: number;
};

type AdminDisplayItem =
    | {
        id: string;
        kind: 'single';
        product: AdminCatalogProduct;
    }
    | {
        id: string;
        kind: 'group';
        product: AdminCatalogProduct;
        variants: AdminCatalogProduct[];
        title: string;
        price: number;
    };

const VARIANT_GROUP_CATEGORIES = new Set(["pizzas", "tartas", "empanadas"]);

function stripSuffix(value: string, suffix: string) {
    return value.toLowerCase().endsWith(suffix.toLowerCase())
        ? value.slice(0, value.length - suffix.length).trim()
        : value;
}

function buildAdminDisplayItems(categorySlug: string | null, items: AdminCatalogProduct[]): AdminDisplayItem[] {
    if (!categorySlug || !VARIANT_GROUP_CATEGORIES.has(categorySlug.toLowerCase())) {
        return items.map((product) => ({ id: product.id, kind: 'single', product }));
    }

    const groups = new Map<string, AdminCatalogProduct[]>();

    for (const product of items) {
        let groupKey = product.nombre;

        if (categorySlug.toLowerCase() === "pizzas") {
            groupKey = stripSuffix(stripSuffix(product.nombre, " - Entera"), " - Media");
        } else if (categorySlug.toLowerCase() === "tartas") {
            groupKey = stripSuffix(stripSuffix(product.nombre, " - Individual"), " - Familiar");
            groupKey = stripSuffix(groupKey, "Tarta de ");
            groupKey = `Tarta de ${groupKey}`;
        } else if (categorySlug.toLowerCase() === "empanadas") {
            groupKey = product.nombre.replace(/\s+x(1|6|12)$/i, "");
        }

        const groupProducts = groups.get(groupKey) ?? [];
        groupProducts.push(product);
        groups.set(groupKey, groupProducts);
    }

    const orderedGroups = Array.from(groups.entries()).sort((a, b) => {
        const firstA = a[1][0];
        const firstB = b[1][0];
        return (firstA.orden ?? 0) - (firstB.orden ?? 0);
    });

    return orderedGroups.map(([groupKey, groupProducts]) => {
        const sortedVariants = [...groupProducts].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        const representative = sortedVariants[0];

        if (sortedVariants.length === 1) {
            return { id: representative.id, kind: 'single', product: representative };
        }

        return {
            id: groupKey,
            kind: 'group',
            product: representative,
            variants: sortedVariants,
            title: groupKey,
            price: Math.min(...sortedVariants.map((variant) => Number(variant.precio))),
        };
    });
}

export default function NuevoPedidoPage() {
    const router = useRouter();
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Catalog Data
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<AdminCatalogProduct[]>([]);

    // Form states
    const [customerQuery, setCustomerQuery] = useState("");
    const [clienteNombre, setClienteNombre] = useState("");
    const [clienteTelefono, setClienteTelefono] = useState("");
    const [clienteDireccion, setClienteDireccion] = useState("");
    
    // UI State
    const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
    const [productQuery, setProductQuery] = useState("");
    const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Search Customers
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (customerQuery.length >= 3) {
                const result = await searchCustomers(customerQuery);
                if (result.success && result.data) {
                    setCustomers(result.data as Customer[]);
                } else {
                    setCustomers([]);
                }
            } else {
                setCustomers([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [customerQuery]);

    // Fetch Full Catalog
    useEffect(() => {
        const fetchCatalog = async () => {
            setLoadingCatalog(true);
            try {
                const res = await getAdminCatalog();
                if (res.success && res.data) {
                    setCategories(res.data.categories as Category[]);
                    setProducts([...(res.data.products as AdminCatalogProduct[]), ...(res.data.promotions as AdminCatalogProduct[])]);
                } else {
                    toast.error("Error al cargar el catálogo");
                }
            } catch (fetchError) {
                console.error("Error fetching catalog:", fetchError);
            } finally {
                setLoadingCatalog(false);
            }
        };

        fetchCatalog();
    }, []);

    const addToCart = (
        product: PublicCatalogProduct & { type: 'PRODUCTO' | 'PROMOCION' }, 
        options: { groupId: string; groupLabel: string; optionId: string; optionLabel: string; priceDelta: number }[] = []
    ) => {
        const optionsPrice = options.reduce((sum, opt) => sum + opt.priceDelta, 0);
        const unitPrice = product.precio + optionsPrice;
        
        let configuredName = product.nombre;
        if (options.length > 0) {
            configuredName = `${product.nombre} + ${options.map(o => o.optionLabel).join(" + ")}`;
        }

        // Generate a unique ID based on product + options so we can stack identical configs
        const configHash = options.map(o => o.optionId).sort().join("|");
        const cartItemId = `${product.id}-${configHash}`;

        setCart(prev => {
            const existing = prev.find(item => item.id === cartItemId);
            if (existing) {
                return prev.map(item =>
                    item.id === cartItemId
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, {
                id: cartItemId,
                productId: product.id,
                nombre: configuredName,
                cantidad: 1,
                precio: unitPrice,
                type: product.type,
                options
            }];
        });

        toast.success(`${product.nombre} agregado`);
    };

    const updateQuantity = (cartItemId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === cartItemId) {
                const newQty = Math.max(1, item.cantidad + delta);
                return { ...item, cantidad: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (cartItemId: string) => {
        setCart(prev => prev.filter(item => item.id !== cartItemId));
    };

    const total = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    }, [cart]);

    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast.error("El carrito está vacío");
            return;
        }

        setSubmitting(true);
        try {
            const result = await createOrder({
                customerId: selectedCustomer?.id || null,
                clienteNombre: selectedCustomer ? selectedCustomer.nombre : (clienteNombre || customerQuery || "Venta de Mostrador"),
                clienteTelefono: selectedCustomer ? selectedCustomer.telefono : clienteTelefono,
                clienteDireccion: clienteDireccion,
                items: cart.map(item => ({
                    productId: item.productId,
                    type: item.type,
                    nombreProduct: item.nombre,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio,
                    options: item.options
                }))
            });

            if (result.success) {
                toast.success("Pedido creado correctamente");
                router.push("/admin/dashboard/pedidos");
                router.refresh();
            } else {
                toast.error(result.error || "Error al crear el pedido");
            }
        } catch {
            toast.error("Error inesperado en el servidor");
        } finally {
            setSubmitting(false);
        }
    };

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.nombre.toLowerCase().includes(productQuery.toLowerCase());
            const itemCategoryIds = p.categoryIds ?? [p.categoriaId];
            const matchesCategory =
                activeCategoryId === 'all' ||
                (activeCategoryId === 'promo'
                    ? p.type === 'PROMOCION' || p.categoriaId === 'promo'
                    : itemCategoryIds.includes(activeCategoryId));
            return matchesSearch && matchesCategory;
        });
    }, [products, productQuery, activeCategoryId]);

    const activeCategorySlug = useMemo(
        () => categories.find((category) => category.id === activeCategoryId)?.slug ?? null,
        [categories, activeCategoryId]
    );

    const displayItems = useMemo(
        () => buildAdminDisplayItems(activeCategorySlug, filteredProducts),
        [activeCategorySlug, filteredProducts]
    );

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] bg-zinc-50/30 overflow-hidden rounded-[2rem]">
            {/* Header */}
            <header className="p-6 flex items-center justify-between bg-white border-b border-zinc-100">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard/pedidos">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Nuevo Pedido</h1>
                        <p className="text-sm text-zinc-500 font-medium">Crea una nueva orden interna</p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={submitting || cart.length === 0}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-6 h-11 gap-2 shadow-lg shadow-zinc-200"
                >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Confirmar Pedido
                </Button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left: Products Selection */}
                <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/50 p-6 overflow-hidden">
                    
                    {/* Search & Customer Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Customer Search */}
                        <div className="flex flex-col justify-between relative z-20">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Cliente (Opcional)</Label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <Input
                                        placeholder="Buscar cliente por nombre o teléfono..."
                                        className="pl-10 h-11 border-zinc-200 focus:ring-zinc-900 rounded-xl bg-white"
                                        value={selectedCustomer ? selectedCustomer.nombre : customerQuery}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedCustomer(null);
                                            setCustomerQuery(val);
                                            setClienteNombre(val);
                                        }}
                                    />
                                    {selectedCustomer && (
                                        <button
                                            onClick={() => {
                                                setSelectedCustomer(null);
                                                setClienteNombre("");
                                                setClienteTelefono("");
                                                setClienteDireccion("");
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!selectedCustomer && (
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Teléfono</Label>
                                        <Input
                                            placeholder="Ej: 11 5555-5555"
                                            className="h-10 border-zinc-200 rounded-xl bg-white"
                                            value={clienteTelefono}
                                            onChange={(e) => setClienteTelefono(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Dirección</Label>
                                        <Input
                                            placeholder="Calle 123, Depto 1"
                                            className="h-10 border-zinc-200 rounded-xl bg-white"
                                            value={clienteDireccion}
                                            onChange={(e) => setClienteDireccion(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {customers.length > 0 && !selectedCustomer && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-100 rounded-xl shadow-xl p-2 max-h-48 overflow-auto top-[74px]">
                                    {customers.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedCustomer(c)}
                                            className="w-full text-left p-3 hover:bg-zinc-50 rounded-lg flex flex-col gap-0.5"
                                        >
                                            <span className="font-semibold text-sm text-zinc-900">{c.nombre}</span>
                                            <span className="text-xs text-zinc-500">{c.telefono || c.email || 'Sin contacto'}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Search */}
                        <div className="flex flex-col justify-between">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Buscar Productos</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <Input
                                        placeholder="Pizza, Pasta, Bebidas..."
                                        className="pl-10 h-11 border-zinc-200 focus:ring-zinc-900 rounded-xl bg-white"
                                        value={productQuery}
                                        onChange={(e) => setProductQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Categories Horizontal Scroll */}
                            <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                <button
                                    onClick={() => setActiveCategoryId('all')}
                                    className={cn(
                                        "flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                                        activeCategoryId === 'all' 
                                            ? "bg-zinc-900 text-white shadow-md" 
                                            : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-100"
                                    )}
                                >
                                    Todos
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategoryId(cat.id)}
                                        className={cn(
                                            "flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                                            activeCategoryId === cat.id 
                                                ? "bg-zinc-900 text-white shadow-md" 
                                                : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-100"
                                        )}
                                    >
                                        {cat.nombre}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setActiveCategoryId('promo')}
                                    className={cn(
                                        "flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                                        activeCategoryId === 'promo' 
                                            ? "bg-primary text-white shadow-md" 
                                            : "bg-white text-primary border border-primary/20 hover:bg-red-50"
                                    )}
                                >
                                    Promociones
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-10 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-max">
                            {loadingCatalog ? (
                                Array(8).fill(0).map((_, i) => (
                                    <div key={i} className="h-28 bg-zinc-200/50 animate-pulse rounded-[2rem]" />
                                ))
                            ) : displayItems.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <div className="bg-white border border-zinc-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Search className="h-8 w-8 text-zinc-300" />
                                    </div>
                                    <p className="text-zinc-500 font-medium">No se encontraron productos</p>
                                    <p className="text-zinc-400 text-sm">Intenta con otros términos o categoría</p>
                                </div>
                            ) : (
                                displayItems.map((item) => (
                                    <div key={item.id} className="transition-all duration-300">
                                        <AdminProductCard
                                            product={item.product}
                                            title={item.kind === 'group' ? item.title : undefined}
                                            displayPrice={item.kind === 'group' ? item.price : undefined}
                                            variants={item.kind === 'group' ? item.variants : undefined}
                                            isExpanded={expandedProductId === item.id}
                                            onToggleExpand={() => setExpandedProductId((current) => current === item.id ? null : item.id)}
                                            onAddToCart={(selectedProduct, options) => {
                                                addToCart(selectedProduct, options);
                                                setExpandedProductId(null);
                                            }}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Cart Summary */}
                <div className="w-full md:w-96 bg-white border-l border-zinc-100 flex flex-col z-10">
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                        <h2 className="font-bold text-lg text-zinc-900">Carrito</h2>
                        <Badge variant="outline" className="rounded-full">{cart.length} items</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-100 scrollbar-track-transparent">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                                <div className="h-16 w-16 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center">
                                    <ShoppingBag className="h-8 w-8 text-zinc-300" />
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900">El carrito está vacío</p>
                                    <p className="text-sm text-zinc-500">Agrega productos del menú para comenzar.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center bg-zinc-50/50 p-3 rounded-2xl border border-zinc-100">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-zinc-900 truncate">{item.nombre}</h4>
                                            <p className="text-xs text-zinc-500 font-medium">${(item.precio).toLocaleString("es-CL")} c/u</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-zinc-200 shadow-sm">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm font-bold w-6 text-center">{item.cantidad}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 space-y-4">
                        <div className="flex items-center justify-between text-zinc-500 font-medium">
                            <span>Subtotal</span>
                            <span>${(total).toLocaleString("es-CL")}</span>
                        </div>
                        <div className="flex items-center justify-between text-xl font-black text-zinc-900">
                            <span>Total</span>
                            <span>${(total).toLocaleString("es-CL")}</span>
                        </div>

                        <div className="p-4 bg-orange-50 rounded-2xl flex items-start gap-3 border border-orange-100">
                            <Check className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-orange-900">Pago en Caja</p>
                                <p className="text-xs text-orange-700/70">Este pedido se registrará como pendiente de pago.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

// ------------------------------------------------------------------------------------------------
// ADMIN PRODUCT CARD WITH INLINE CONFIGURATOR
// ------------------------------------------------------------------------------------------------

interface AdminProductCardProps {
    product: AdminCatalogProduct;
    title?: string;
    displayPrice?: number;
    variants?: AdminCatalogProduct[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onAddToCart: (
        product: AdminCatalogProduct,
        options?: { 
            groupId: string; 
            groupLabel: string; 
            optionId: string; 
            optionLabel: string; 
            priceDelta: number;
            recipeMultiplier?: number | null;
            optionProductId?: string | null;
        }[]
    ) => void;
}

function AdminProductCard({ product, title, displayPrice, variants, isExpanded, onToggleExpand, onAddToCart }: AdminProductCardProps) {
    const isExpandable = Boolean((variants && variants.length > 1) || (product.optionGroups && product.optionGroups.length > 0));
    const [selectedOptions, setSelectedOptions] = useState<Record<string, { 
        optionId: string; 
        optionLabel: string; 
        priceDelta: number;
        recipeMultiplier?: number | null;
        optionProductId?: string | null;
    }>>({});
    const cardTitle = title ?? product.nombre;
    const cardPrice = displayPrice ?? product.precio;

    const configuredOptions = Object.entries(selectedOptions).map(([groupId, option]) => {
        const group = product.optionGroups.find((item) => item.id === groupId)!;
        return {
            groupId,
            groupLabel: group.nombre,
            optionId: option.optionId,
            optionLabel: option.optionLabel,
            priceDelta: option.priceDelta,
            recipeMultiplier: option.recipeMultiplier,
            optionProductId: option.optionProductId,
        };
    });

    const missingRequiredGroups = product.optionGroups.filter((group) => group.required && !selectedOptions[group.id]);
    const configuredPrice = product.precio + configuredOptions.reduce((sum, option) => sum + option.priceDelta, 0);

    const handleCardClick = () => {
        if (isExpandable) {
            onToggleExpand();
            return;
        }

        onAddToCart(product);
    };

    const handleConfirmOptions = () => {
        if (missingRequiredGroups.length > 0) {
            toast.error(`Falta seleccionar opción para ${missingRequiredGroups[0].nombre}`);
            return;
        }

        onAddToCart(product, configuredOptions);
    };

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                "group relative isolate overflow-visible rounded-[2rem] border bg-white transition-all duration-300 ease-out",
                "border-zinc-200 cursor-pointer hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_16px_40px_rgba(24,24,27,0.08)] hover:z-10",
                isExpanded && "z-30 border-zinc-300 shadow-[0_22px_50px_rgba(24,24,27,0.10)]"
            )}
        >
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-orange-100/60 to-transparent blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div
                className={cn(
                    "relative z-10 flex min-h-[164px] gap-4 rounded-[2rem] bg-white p-4 transition-all duration-300",
                    isExpanded && "opacity-0 pointer-events-none rotate-y-180"
                )}
            >
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50">
                    {product.imagen ? (
                        <img
                            src={product.imagen}
                            alt={product.nombre}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-zinc-300" />
                        </div>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                                {product.categoriaNombre}
                            </span>
                            {isExpandable ? (
                                <Badge variant="outline" className="rounded-full border-orange-200 bg-orange-50 px-2 py-0 text-[10px] font-bold text-orange-700">
                                    Opciones
                                </Badge>
                            ) : null}
                        </div>
                        <h4 className="mt-1 line-clamp-2 text-base font-bold leading-tight text-zinc-900">
                            {cardTitle}
                        </h4>
                    </div>

                    <div className="mt-2 flex items-end justify-between gap-3">
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tight text-zinc-900">
                                ${(cardPrice).toLocaleString("es-CL")}
                            </span>
                        </div>

                        {isExpandable ? (
                            <Button
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleExpand();
                                }}
                                className="h-10 w-10 rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart(product);
                                }}
                                className="h-8 w-8 rounded-full bg-zinc-900 text-white transition-all hover:scale-105 hover:bg-zinc-800"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {isExpandable && isExpanded ? (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 right-0 top-0 z-40 rounded-[2rem] border border-zinc-300 bg-white shadow-[0_26px_70px_rgba(24,24,27,0.16)]"
                >
                    <div className="flex min-h-[216px] max-h-[264px] flex-col p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                                    {product.categoriaNombre}
                                </p>
                                <h4 className="mt-1 line-clamp-2 text-base font-bold leading-tight text-zinc-950">
                                    {cardTitle}
                                </h4>
                            </div>
                            <Button
                                size="icon"
                                type="button"
                                onClick={onToggleExpand}
                                className="h-9 w-9 rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50"
                            >
                                <ChevronDown className="h-4 w-4 rotate-180" />
                            </Button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                            {variants && variants.length > 1 ? (
                                <section className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-zinc-900">Opciones</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onAddToCart(variant);
                                                }}
                                                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 transition-all hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                                            >
                                                <span>{variant.nombre}</span>
                                                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black ring-1 ring-zinc-200">
                                                    ${Number(variant.precio).toLocaleString("es-CL")}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            {product.optionGroups.map((group) => (
                                <section key={group.id} className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-zinc-900">{group.nombre}</p>
                                        {group.required ? (
                                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-red-600">
                                                Obligatorio
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {group.options.map((option) => {
                                            const priceDelta = group.priceMode === "ADD" ? option.price : option.price - product.precio;
                                            const isSelected = selectedOptions[group.id]?.optionId === option.id;

                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedOptions((current) => ({
                                                            ...current,
                                                            [group.id]: {
                                                                optionId: option.id,
                                                                optionLabel: option.label,
                                                                priceDelta,
                                                                recipeMultiplier: option.recipeMultiplier,
                                                                optionProductId: option.optionProductId,
                                                            },
                                                        }))
                                                    }
                                                    className={cn(
                                                        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-all",
                                                        isSelected
                                                            ? "border-zinc-900 bg-zinc-900 text-white"
                                                            : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white"
                                                    )}
                                                >
                                                    <span>{option.label}</span>
                                                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-black", isSelected ? "bg-white/15" : "bg-white ring-1 ring-zinc-200")}>
                                                        {priceDelta > 0 ? `+ $${option.price}` : `$${option.price}`}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                            <p className="text-lg font-black tracking-tight text-zinc-950">
                                ${configuredPrice.toLocaleString("es-CL")}
                            </p>
                            <Button
                                type="button"
                                onClick={handleConfirmOptions}
                                className="h-10 rounded-full bg-[#E30909] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(227,9,9,0.2)] hover:bg-[#c20707]"
                            >
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

interface AdminProductConfiguratorPanelProps {
    product: (PublicCatalogProduct & { type: 'PRODUCTO' | 'PROMOCION', categoriaNombre: string }) | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (
        product: PublicCatalogProduct & { type: 'PRODUCTO' | 'PROMOCION', categoriaNombre: string },
        options: { 
            groupId: string; 
            groupLabel: string; 
            optionId: string; 
            optionLabel: string; 
            priceDelta: number;
            recipeMultiplier?: number | null;
            optionProductId?: string | null;
        }[]
    ) => void;
}

function AdminProductConfiguratorPanel({ product, open, onOpenChange, onConfirm }: AdminProductConfiguratorPanelProps) {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, { 
        optionId: string; 
        optionLabel: string; 
        priceDelta: number;
        recipeMultiplier?: number | null;
        optionProductId?: string | null;
    }>>({});

    if (!product) {
        return null;
    }

    const configuredOptions = Object.entries(selectedOptions).map(([groupId, option]) => {
        const group = product.optionGroups.find((item) => item.id === groupId)!;
        return {
            groupId,
            groupLabel: group.nombre,
            optionId: option.optionId,
            optionLabel: option.optionLabel,
            priceDelta: option.priceDelta,
            recipeMultiplier: option.recipeMultiplier,
            optionProductId: option.optionProductId,
        };
    });

    const missingRequiredGroups = product.optionGroups.filter((group) => group.required && !selectedOptions[group.id]);
    const configuredPrice = product.precio + configuredOptions.reduce((sum, option) => sum + option.priceDelta, 0);

    const handleConfirm = () => {
        if (missingRequiredGroups.length > 0) {
            toast.error(`Falta seleccionar opción para ${missingRequiredGroups[0].nombre}`);
            return;
        }

        onConfirm(product, configuredOptions);
    };

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={onOpenChange}
            title="Configurar producto"
            description="Elegí las opciones antes de agregarlo al pedido."
            desktopMode="dialog"
            mobileSide="bottom"
            contentClassName="sm:max-w-4xl"
            desktopContentClassName="p-0"
            mobileContentClassName="px-0 pt-0"
        >
            <div className="overflow-hidden rounded-[1.75rem]">
                <div className="border-b border-zinc-100 bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),_transparent_40%),linear-gradient(180deg,#fff,#fff7ed)] px-6 py-5 md:px-8 md:py-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-24 w-24 overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-sm">
                                {product.imagen ? (
                                    <img src={product.imagen} alt={product.nombre} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-300">
                                        <ShoppingBag className="h-7 w-7" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="rounded-full border-orange-200 bg-white/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-700">
                                        {product.categoriaNombre}
                                    </Badge>
                                    <Badge variant="outline" className="rounded-full border-zinc-200 bg-white/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                                        {product.optionGroups.length} grupos
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight text-zinc-950">{product.nombre}</h3>
                                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
                                        {product.descripcion || "Terminá de configurarlo antes de enviarlo al carrito."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Precio configurado</p>
                            <p className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                                ${configuredPrice.toLocaleString("es-CL")}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="space-y-5 px-6 py-6 md:px-8">
                        {product.optionGroups.map((group, index) => (
                            <section
                                key={group.id}
                                className={cn(
                                    "rounded-[1.5rem] border p-4 md:p-5",
                                    selectedOptions[group.id] ? "border-zinc-900 bg-zinc-50/80" : "border-zinc-200 bg-white"
                                )}
                            >
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                            Paso {index + 1}
                                        </p>
                                        <h4 className="mt-1 text-lg font-black tracking-tight text-zinc-950">{group.nombre}</h4>
                                    </div>
                                    {group.required ? (
                                        <Badge className="rounded-full border-none bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-600 shadow-none">
                                            Obligatorio
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="rounded-full border-zinc-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                                            Opcional
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {group.options.map((option) => {
                                        const priceDelta = group.priceMode === "ADD" ? option.price : option.price - product.precio;
                                        const isSelected = selectedOptions[group.id]?.optionId === option.id;

                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedOptions((current) => ({
                                                        ...current,
                                                        [group.id]: {
                                                            optionId: option.id,
                                                            optionLabel: option.label,
                                                            priceDelta,
                                                            recipeMultiplier: option.recipeMultiplier,
                                                            optionProductId: option.optionProductId,
                                                        },
                                                    }))
                                                }
                                                className={cn(
                                                    "rounded-[1.35rem] border px-4 py-4 text-left transition-all duration-200",
                                                    isSelected
                                                        ? "border-zinc-900 bg-zinc-900 text-white shadow-[0_14px_30px_rgba(24,24,27,0.18)]"
                                                        : "border-zinc-200 bg-zinc-50/70 text-zinc-800 hover:border-zinc-300 hover:bg-white"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold leading-tight">{option.label}</p>
                                                        <p className={cn("mt-1 text-xs", isSelected ? "text-white/70" : "text-zinc-500")}>
                                                            {group.priceMode === "ADD" ? "Suma sobre el base" : "Reemplaza el precio base"}
                                                        </p>
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            "rounded-full px-2 py-1 text-[11px] font-black",
                                                            isSelected ? "bg-white/15 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"
                                                        )}
                                                    >
                                                        {priceDelta > 0 ? `+ $${option.price}` : `$${option.price}`}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>

                    <aside className="border-t border-zinc-100 bg-zinc-50/80 px-6 py-6 md:border-l md:border-t-0">
                        <div className="space-y-4 md:sticky md:top-0">
                            <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-orange-500" />
                                    <p className="text-sm font-black tracking-tight text-zinc-950">Resumen de configuración</p>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {product.optionGroups.map((group) => {
                                        const selected = selectedOptions[group.id];

                                        return (
                                            <div key={group.id} className="rounded-2xl bg-zinc-50 px-3 py-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{group.nombre}</p>
                                                <p className="mt-1 text-sm font-bold text-zinc-900">
                                                    {selected ? selected.optionLabel : group.required ? "Falta elegir" : "Sin selección"}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {missingRequiredGroups.length > 0 ? (
                                <div className="rounded-[1.5rem] border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-orange-800">
                                    Faltan opciones obligatorias para continuar.
                                </div>
                            ) : (
                                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                                    Configuración lista para agregar al carrito.
                                </div>
                            )}

                            <Button
                                type="button"
                                onClick={handleConfirm}
                                className="h-12 w-full rounded-2xl bg-[#E30909] text-base font-black text-white shadow-[0_16px_32px_rgba(227,9,9,0.22)] hover:bg-[#c20707]"
                            >
                                Confirmar opciones
                            </Button>
                        </div>
                    </aside>
                </div>
            </div>
        </ResponsivePanel>
    );
}

void AdminProductConfiguratorPanel;
