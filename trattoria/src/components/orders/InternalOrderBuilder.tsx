"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronDown,
    Loader2,
    Minus,
    Plus,
    Save,
    Search,
    ShoppingBag,
    Sparkles,
    Trash2,
    UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { createOrder as createAdminOrder, getAdminCatalog, searchCustomers as searchAdminCustomers } from "@/app/admin/dashboard/pedidos/actions";
import { createOrder as createEmployeeOrder, getOperationalCatalog, searchCustomers as searchEmployeeCustomers } from "@/app/empleado/pedidos/actions";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileChromeVisibility } from "@/hooks/use-mobile-chrome-visibility";
import { PublicCatalogProduct } from "@/lib/catalog-config";
import { cn } from "@/lib/utils";

type BuilderRole = "admin" | "employee";

type Customer = {
    id: string;
    nombre: string;
    telefono?: string;
    email?: string;
};

type Category = {
    id: string;
    nombre: string;
    slug: string;
};

type CatalogProduct = PublicCatalogProduct & {
    type: "PRODUCTO" | "PROMOCION";
    categoriaId: string;
    categoriaNombre: string;
    categoriaSlug?: string;
    categoryIds?: string[];
    orden?: number;
};

type CatalogResponse = {
    categories: Category[];
    products: CatalogProduct[];
    promotions: CatalogProduct[];
};

type CartOption = {
    groupId: string;
    groupLabel: string;
    optionId: string;
    optionLabel: string;
    priceDelta: number;
    recipeMultiplier?: number | null;
    optionProductId?: string | null;
};

type CartItem = {
    id: string;
    productId: string;
    nombre: string;
    cantidad: number;
    precio: number;
    type: "PRODUCTO" | "PROMOCION";
    options: CartOption[];
};

type DisplayItem =
    | {
          id: string;
          kind: "single";
          product: CatalogProduct;
      }
    | {
          id: string;
          kind: "group";
          product: CatalogProduct;
          variants: CatalogProduct[];
          title: string;
          price: number;
      };

const VARIANT_GROUP_CATEGORIES = new Set(["pizzas", "tartas", "empanadas"]);

function stripSuffix(value: string, suffix: string) {
    return value.toLowerCase().endsWith(suffix.toLowerCase())
        ? value.slice(0, value.length - suffix.length).trim()
        : value;
}

function buildDisplayItems(categorySlug: string | null, items: CatalogProduct[]): DisplayItem[] {
    if (!categorySlug || !VARIANT_GROUP_CATEGORIES.has(categorySlug.toLowerCase())) {
        return items.map((product) => ({ id: product.id, kind: "single", product }));
    }

    const groups = new Map<string, CatalogProduct[]>();

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

        const existing = groups.get(groupKey) ?? [];
        existing.push(product);
        groups.set(groupKey, existing);
    }

    return Array.from(groups.entries())
        .sort((a, b) => ((a[1][0].orden ?? 0) - (b[1][0].orden ?? 0)))
        .map(([groupKey, groupProducts]) => {
            const variants = [...groupProducts].sort((a, b) => ((a.orden ?? 0) - (b.orden ?? 0)));
            const representative = variants[0];

            if (variants.length === 1) {
                return { id: representative.id, kind: "single", product: representative };
            }

            return {
                id: groupKey,
                kind: "group",
                product: representative,
                variants,
                title: groupKey,
                price: Math.min(...variants.map((variant) => Number(variant.precio))),
            };
        });
}

function requiresConfiguration(product: CatalogProduct) {
    return product.catalogRole === "CONFIGURABLE_BASE" || product.optionGroups.length > 0;
}

function getBackHref(role: BuilderRole) {
    return role === "admin" ? "/admin/dashboard/pedidos" : "/empleado/pedidos";
}

function getSearchCustomers(role: BuilderRole) {
    return role === "admin" ? searchAdminCustomers : searchEmployeeCustomers;
}

function getCreateOrder(role: BuilderRole) {
    return role === "admin" ? createAdminOrder : createEmployeeOrder;
}

function getCatalog(role: BuilderRole) {
    return role === "admin" ? getAdminCatalog : getOperationalCatalog;
}

type InternalOrderBuilderProps = {
    role: BuilderRole;
};

export function InternalOrderBuilder({ role }: InternalOrderBuilderProps) {
    const router = useRouter();
    const isMobile = useIsMobile();
    const rootRef = useRef<HTMLDivElement | null>(null);

    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerQuery, setCustomerQuery] = useState("");
    const [clienteNombre, setClienteNombre] = useState("");
    const [clienteTelefono, setClienteTelefono] = useState("");
    const [clienteDireccion, setClienteDireccion] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState("all");
    const [productQuery, setProductQuery] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
    const [configProduct, setConfigProduct] = useState<CatalogProduct | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    const activeOverlay = Boolean(configProduct) || cartOpen;
    useMobileChromeVisibility(isMobile && (activeOverlay || isInputFocused));

    useEffect(() => {
        const element = rootRef.current;
        if (!element || !isMobile) {
            return;
        }

        const updateFocusState = () => {
            const activeElement = document.activeElement;
            if (!activeElement || !(activeElement instanceof HTMLElement)) {
                setIsInputFocused(false);
                return;
            }

            const isEditable =
                activeElement.matches("input, textarea, select") ||
                activeElement.isContentEditable;

            setIsInputFocused(isEditable && element.contains(activeElement));
        };

        document.addEventListener("focusin", updateFocusState);
        document.addEventListener("focusout", updateFocusState);
        updateFocusState();

        return () => {
            document.removeEventListener("focusin", updateFocusState);
            document.removeEventListener("focusout", updateFocusState);
        };
    }, [isMobile]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (customerQuery.trim().length < 3) {
                setCustomers([]);
                return;
            }

            const result = await getSearchCustomers(role)(customerQuery.trim());
            if (result.success && result.data) {
                setCustomers(result.data as Customer[]);
            } else {
                setCustomers([]);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [customerQuery, role]);

    useEffect(() => {
        const loadCatalog = async () => {
            setLoadingCatalog(true);
            try {
                const response = await getCatalog(role)();
                if (!response.success || !response.data) {
                    toast.error("No se pudo cargar el catalogo operativo");
                    return;
                }

                const data = response.data as CatalogResponse;
                setCategories(data.categories);
                setProducts([...(data.products ?? []), ...(data.promotions ?? [])]);
            } catch (error) {
                console.error("Error loading internal order catalog:", error);
                toast.error("Error al cargar el catalogo operativo");
            } finally {
                setLoadingCatalog(false);
            }
        };

        void loadCatalog();
    }, [role]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const query = productQuery.trim().toLowerCase();
            const matchesSearch =
                query.length === 0 ||
                product.nombre.toLowerCase().includes(query) ||
                (product.descripcion ?? "").toLowerCase().includes(query);

            const itemCategoryIds = product.categoryIds ?? [product.categoriaId];
            const matchesCategory =
                activeCategoryId === "all" ||
                (activeCategoryId === "promo"
                    ? product.type === "PROMOCION" || product.categoriaId === "promo"
                    : itemCategoryIds.includes(activeCategoryId));

            return matchesSearch && matchesCategory;
        });
    }, [activeCategoryId, productQuery, products]);

    const activeCategorySlug = useMemo(
        () => categories.find((category) => category.id === activeCategoryId)?.slug ?? null,
        [activeCategoryId, categories]
    );

    const displayItems = useMemo(
        () => buildDisplayItems(activeCategorySlug, filteredProducts),
        [activeCategorySlug, filteredProducts]
    );

    const total = useMemo(
        () => cart.reduce((accumulator, item) => accumulator + (item.precio * item.cantidad), 0),
        [cart]
    );

    const totalItems = useMemo(
        () => cart.reduce((accumulator, item) => accumulator + item.cantidad, 0),
        [cart]
    );

    const addToCart = (product: CatalogProduct, options: CartOption[] = []) => {
        const optionsPrice = options.reduce((sum, option) => sum + option.priceDelta, 0);
        const configuredName = options.length > 0
            ? `${product.nombre} + ${options.map((option) => option.optionLabel).join(" + ")}`
            : product.nombre;
        const cartItemId = `${product.id}-${options.map((option) => option.optionId).sort().join("|")}`;
        const unitPrice = Number(product.precio) + optionsPrice;

        setCart((current) => {
            const existing = current.find((item) => item.id === cartItemId);
            if (existing) {
                return current.map((item) =>
                    item.id === cartItemId ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            }

            return [
                ...current,
                {
                    id: cartItemId,
                    productId: product.id,
                    nombre: configuredName,
                    cantidad: 1,
                    precio: unitPrice,
                    type: product.type,
                    options,
                },
            ];
        });

        toast.success(`${product.nombre} agregado`);
    };

    const updateQuantity = (cartItemId: string, delta: number) => {
        setCart((current) =>
            current.map((item) =>
                item.id === cartItemId
                    ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
                    : item
            )
        );
    };

    const removeFromCart = (cartItemId: string) => {
        setCart((current) => current.filter((item) => item.id !== cartItemId));
    };

    const handleSelectProduct = (product: CatalogProduct) => {
        if (requiresConfiguration(product)) {
            setConfigProduct(product);
            return;
        }

        addToCart(product);
    };

    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast.error("El carrito esta vacio");
            return;
        }

        setSubmitting(true);
        try {
            const result = await getCreateOrder(role)({
                customerId: selectedCustomer?.id || null,
                clienteNombre: selectedCustomer ? selectedCustomer.nombre : (clienteNombre || customerQuery || "Venta de Mostrador"),
                clienteTelefono: selectedCustomer ? selectedCustomer.telefono : clienteTelefono,
                clienteDireccion,
                items: cart.map((item) => ({
                    productId: item.productId,
                    type: item.type,
                    nombreProduct: item.nombre,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio,
                    options: item.options,
                })),
            });

            if (!result.success) {
                toast.error(result.error || "No se pudo crear el pedido");
                return;
            }

            toast.success("Pedido creado correctamente");
            router.push(getBackHref(role));
            router.refresh();
        } catch (error) {
            console.error("Error creating internal order:", error);
            toast.error("Error inesperado al crear el pedido");
        } finally {
            setSubmitting(false);
        }
    };

    const customerInputValue = selectedCustomer ? selectedCustomer.nombre : customerQuery;

    return (
        <div ref={rootRef} className="app-page-safe-bottom flex min-h-screen flex-col gap-5 bg-white px-4 py-4 sm:px-6 md:gap-6 md:px-8 md:py-8">
            <section className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <Link
                            href={getBackHref(role)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-900"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Volver a pedidos
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Nuevo Pedido</h1>
                            <p className="mt-1 text-sm text-zinc-500">
                                Carga el cliente, filtra el menu y arma el pedido en un solo flujo.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || cart.length === 0}
                        className="hidden h-11 rounded-2xl bg-zinc-900 px-5 font-bold text-white shadow-lg shadow-zinc-200 hover:bg-zinc-800 md:inline-flex"
                    >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Confirmar pedido
                    </Button>
                </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.85fr)_22rem]">
                <div className="space-y-5">
                    <article className="relative rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Cliente</Label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        placeholder="Buscar cliente por nombre o telefono..."
                                        className="h-12 rounded-2xl border-zinc-200 pl-10"
                                        value={customerInputValue}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setSelectedCustomer(null);
                                            setCustomerQuery(value);
                                            setClienteNombre(value);
                                        }}
                                    />
                                    {selectedCustomer ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCustomer(null);
                                                setCustomerQuery("");
                                                setClienteNombre("");
                                                setClienteTelefono("");
                                                setClienteDireccion("");
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Buscar productos</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        placeholder="Pizza, promo, bebida..."
                                        className="h-12 rounded-2xl border-zinc-200 pl-10"
                                        value={productQuery}
                                        onChange={(event) => setProductQuery(event.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {!selectedCustomer ? (
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Telefono</Label>
                                    <Input
                                        placeholder="Ej: 11 5555-5555"
                                        className="h-11 rounded-2xl border-zinc-200"
                                        value={clienteTelefono}
                                        onChange={(event) => setClienteTelefono(event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Direccion</Label>
                                    <Input
                                        placeholder="Calle 123, depto 1"
                                        className="h-11 rounded-2xl border-zinc-200"
                                        value={clienteDireccion}
                                        onChange={(event) => setClienteDireccion(event.target.value)}
                                    />
                                </div>
                            </div>
                        ) : null}

                        {customers.length > 0 && !selectedCustomer ? (
                            <div className="absolute inset-x-5 top-[5.6rem] z-20 rounded-[1.5rem] border border-zinc-200 bg-white p-2 shadow-2xl">
                                {customers.map((customer) => (
                                    <button
                                        key={customer.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCustomer(customer);
                                            setClienteNombre(customer.nombre);
                                            setClienteTelefono(customer.telefono || "");
                                        }}
                                        className="flex w-full flex-col gap-0.5 rounded-xl p-3 text-left transition-colors hover:bg-zinc-50"
                                    >
                                        <span className="font-semibold text-zinc-900">{customer.nombre}</span>
                                        <span className="text-xs text-zinc-500">{customer.telefono || customer.email || "Sin contacto"}</span>
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </article>

                    <article className="space-y-4 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveCategoryId("all")}
                                className={cn(
                                    "rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition",
                                    activeCategoryId === "all"
                                        ? "bg-zinc-900 text-white shadow-md"
                                        : "border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-white"
                                )}
                            >
                                Todos
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveCategoryId("promo")}
                                className={cn(
                                    "rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition",
                                    activeCategoryId === "promo"
                                        ? "bg-zinc-900 text-white shadow-md"
                                        : "border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-white"
                                )}
                            >
                                Promos
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => setActiveCategoryId(category.id)}
                                    className={cn(
                                        "rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition",
                                        activeCategoryId === category.id
                                            ? "bg-zinc-900 text-white shadow-md"
                                            : "border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-white"
                                    )}
                                >
                                    {category.nombre}
                                </button>
                            ))}
                        </div>

                        {loadingCatalog ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="h-40 animate-pulse rounded-[1.75rem] bg-zinc-100" />
                                ))}
                            </div>
                        ) : displayItems.length === 0 ? (
                            <div className="rounded-[1.75rem] border border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-12 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-300 shadow-sm">
                                    <Search className="h-6 w-6" />
                                </div>
                                <p className="font-semibold text-zinc-900">No encontramos items para este filtro</p>
                                <p className="mt-1 text-sm text-zinc-500">Prueba con otra busqueda o cambia de categoria.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {displayItems.map((item) => (
                                    <CatalogCard
                                        key={item.id}
                                        item={item}
                                        isExpanded={expandedGroupId === item.id}
                                        onToggleExpand={() => setExpandedGroupId((current) => (current === item.id ? null : item.id))}
                                        onSelectProduct={handleSelectProduct}
                                    />
                                ))}
                            </div>
                        )}
                    </article>
                </div>

                <aside className="hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm xl:block">
                    <CartPanel
                        cart={cart}
                        total={total}
                        totalItems={totalItems}
                        submitting={submitting}
                        onRemove={removeFromCart}
                        onUpdateQuantity={updateQuantity}
                        onSubmit={handleSubmit}
                    />
                </aside>
            </section>

            {isMobile && cart.length > 0 ? (
                <div className="fixed inset-x-0 bottom-[calc(var(--admin-mobile-nav-offset)+0.75rem)] z-30 px-4">
                    <div className="mx-auto max-w-lg">
                        <button
                            type="button"
                            onClick={() => setCartOpen(true)}
                            className="flex w-full items-center justify-between rounded-[1.7rem] bg-zinc-950 px-4 py-3 text-left text-white shadow-[0_20px_45px_rgba(15,23,42,0.24)]"
                        >
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Carrito</p>
                                <p className="mt-1 text-sm font-semibold">{totalItems} item(s)</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-black">${total.toLocaleString("es-AR")}</span>
                                <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em]">
                                    Ver
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            ) : null}

            <ResponsivePanel
                open={cartOpen}
                onOpenChange={setCartOpen}
                title="Carrito del pedido"
                description="Revisa cantidades y confirma cuando este listo."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-lg"
                mobileContentClassName="px-0 pt-0"
            >
                <CartPanel
                    cart={cart}
                    total={total}
                    totalItems={totalItems}
                    submitting={submitting}
                    onRemove={removeFromCart}
                    onUpdateQuantity={updateQuantity}
                    onSubmit={handleSubmit}
                />
            </ResponsivePanel>

            <ProductConfiguratorPanel
                product={configProduct}
                open={configProduct !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfigProduct(null);
                    }
                }}
                onConfirm={(product, options) => {
                    addToCart(product, options);
                    setConfigProduct(null);
                }}
            />
        </div>
    );
}

function CatalogCard({
    item,
    isExpanded,
    onToggleExpand,
    onSelectProduct,
}: {
    item: DisplayItem;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onSelectProduct: (product: CatalogProduct) => void;
}) {
    const product = item.product;
    const displayPrice = item.kind === "group" ? item.price : product.minSelectablePrice;

    return (
        <article className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg">
            <button
                type="button"
                onClick={() => (item.kind === "group" ? onToggleExpand() : onSelectProduct(product))}
                className="block w-full text-left"
            >
                <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
                                    {product.type === "PROMOCION" ? "Promocion" : "Producto"}
                                </Badge>
                                {requiresConfiguration(product) ? (
                                    <Badge variant="outline" className="rounded-full border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                                        Configurable
                                    </Badge>
                                ) : null}
                            </div>
                            <h3 className="mt-3 line-clamp-2 text-lg font-black tracking-tight text-zinc-950">
                                {item.kind === "group" ? item.title : product.nombre}
                            </h3>
                            <p className="mt-1 text-sm text-zinc-500">{product.categoriaNombre}</p>
                        </div>
                        <Badge className="rounded-full bg-zinc-900 px-3 py-1 text-sm font-black text-white hover:bg-zinc-900">
                            ${Number(displayPrice).toLocaleString("es-AR")}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-zinc-500">
                        <span>{item.kind === "group" ? `${item.variants.length} variantes` : product.optionGroups.length > 0 ? `${product.optionGroups.length} grupo(s)` : "Alta rapida"}</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-zinc-700">
                            {item.kind === "group" ? "Elegir" : requiresConfiguration(product) ? "Configurar" : "Agregar"}
                            <ChevronDown className={cn("h-4 w-4", item.kind === "group" && isExpanded ? "rotate-180" : "")} />
                        </span>
                    </div>
                </div>
            </button>

            {item.kind === "group" && isExpanded ? (
                <div className="border-t border-zinc-100 bg-zinc-50/60 p-4">
                    <div className="flex flex-wrap gap-2">
                        {item.variants.map((variant) => (
                            <button
                                key={variant.id}
                                type="button"
                                onClick={() => onSelectProduct(variant)}
                                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                            >
                                <span>{variant.nombre}</span>
                                <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] font-black text-zinc-700">
                                    ${Number(variant.minSelectablePrice).toLocaleString("es-AR")}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
        </article>
    );
}

function CartPanel({
    cart,
    total,
    totalItems,
    submitting,
    onRemove,
    onUpdateQuantity,
    onSubmit,
}: {
    cart: CartItem[];
    total: number;
    totalItems: number;
    submitting: boolean;
    onRemove: (cartItemId: string) => void;
    onUpdateQuantity: (cartItemId: string, delta: number) => void;
    onSubmit: () => void;
}) {
    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-zinc-100 px-5 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Carrito</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-black tracking-tight text-zinc-950">{totalItems} item(s)</h2>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                        ${total.toLocaleString("es-AR")}
                    </Badge>
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
                            <ShoppingBag className="h-8 w-8 text-zinc-300" />
                        </div>
                        <p className="font-semibold text-zinc-900">El carrito esta vacio</p>
                        <p className="mt-1 text-sm text-zinc-500">Agrega productos o promociones para continuar.</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="rounded-[1.5rem] bg-zinc-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-zinc-900">{item.nombre}</p>
                                    <p className="mt-1 text-sm text-zinc-500">${item.precio.toLocaleString("es-AR")} c/u</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemove(item.id)}
                                    className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white p-1">
                                    <button
                                        type="button"
                                        onClick={() => onUpdateQuantity(item.id, -1)}
                                        className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-50"
                                    >
                                        <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="w-8 text-center text-sm font-black text-zinc-950">{item.cantidad}</span>
                                    <button
                                        type="button"
                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                        className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-50"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <p className="text-sm font-black text-zinc-950">${(item.precio * item.cantidad).toLocaleString("es-AR")}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="border-t border-zinc-100 px-5 py-4">
                <div className="flex items-center justify-between text-sm font-medium text-zinc-500">
                    <span>Total</span>
                    <span className="text-lg font-black text-zinc-950">${total.toLocaleString("es-AR")}</span>
                </div>
                <Button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting || cart.length === 0}
                    className="mt-4 h-12 w-full rounded-2xl bg-zinc-900 text-base font-black text-white hover:bg-zinc-800"
                >
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Confirmar pedido
                </Button>
            </div>
        </div>
    );
}

function ProductConfiguratorPanel({
    product,
    open,
    onOpenChange,
    onConfirm,
}: {
    product: CatalogProduct | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (product: CatalogProduct, options: CartOption[]) => void;
}) {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, CartOption>>({});

    if (!product) {
        return null;
    }

    const configuredOptions = Object.values(selectedOptions);
    const configuredPrice = Number(product.precio) + configuredOptions.reduce((sum, option) => sum + option.priceDelta, 0);
    const missingRequiredGroups = product.optionGroups.filter((group) => group.required && !selectedOptions[group.id]);

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={onOpenChange}
            title="Configurar producto"
            description="Elige las opciones antes de agregarlo al pedido."
            desktopMode="dialog"
            mobileSide="bottom"
            contentClassName="sm:max-w-4xl"
            desktopContentClassName="p-0"
            mobileContentClassName="px-0 pt-0"
        >
            <div className="overflow-hidden rounded-[1.75rem]">
                <div className="border-b border-zinc-100 bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),_transparent_40%),linear-gradient(180deg,#fff,#fff7ed)] px-6 py-5 md:px-8 md:py-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
                                    {product.descripcion || "Configura las opciones requeridas antes de continuar."}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Precio configurado</p>
                            <p className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                                ${configuredPrice.toLocaleString("es-AR")}
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
                                        const priceDelta = group.priceMode === "ADD" ? option.price : option.price - Number(product.precio);
                                        const isSelected = selectedOptions[group.id]?.optionId === option.id;

                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedOptions((current) => ({
                                                        ...current,
                                                        [group.id]: {
                                                            groupId: group.id,
                                                            groupLabel: group.nombre,
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
                                    <p className="text-sm font-black tracking-tight text-zinc-950">Resumen</p>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {product.optionGroups.map((group) => {
                                        const selected = selectedOptions[group.id];
                                        return (
                                            <div key={group.id} className="rounded-2xl bg-zinc-50 px-3 py-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{group.nombre}</p>
                                                <p className="mt-1 text-sm font-bold text-zinc-900">
                                                    {selected ? selected.optionLabel : group.required ? "Falta elegir" : "Sin seleccion"}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <Button
                                type="button"
                                disabled={missingRequiredGroups.length > 0}
                                onClick={() => onConfirm(product, configuredOptions)}
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
