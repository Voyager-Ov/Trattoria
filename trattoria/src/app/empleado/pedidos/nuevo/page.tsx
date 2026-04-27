"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ChevronLeft,
    Loader2,
    Plus,
    Save,
    Search,
    ShoppingBag,
    Trash2,
    UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createOrder, searchCustomers } from "../actions";

type MenuItem = {
    id: string;
    nombre: string;
    precio: number;
    categoria: string;
    imagen?: string | null;
    type: "PRODUCTO" | "PROMOCION";
    categoryId: string;
    categoryIds?: string[];
    categoryNames?: string[];
    activo: boolean;
    disponible: boolean;
};

type CartItem = {
    productId: string;
    nombre: string;
    cantidad: number;
    precio: number;
    type: "PRODUCTO" | "PROMOCION";
};

type Customer = {
    id: string;
    nombre: string;
    telefono?: string;
    email?: string;
};

type Category = {
    id: string;
    nombre: string;
};

type CategoryOption = {
    id: string;
    nombre: string;
    description: string;
    totalItems: number;
};

const UNCATEGORIZED_PROMOS_ID = "__promociones__";

export default function NuevoPedidoPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [loadingCatalog, setLoadingCatalog] = useState(true);

    const [customerQuery, setCustomerQuery] = useState("");
    const [clienteNombre, setClienteNombre] = useState("");
    const [clienteTelefono, setClienteTelefono] = useState("");
    const [clienteDireccion, setClienteDireccion] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [productQuery, setProductQuery] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);

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

    useEffect(() => {
        const loadCatalog = async () => {
            setLoadingCatalog(true);
            try {
                const [menuRes, catRes] = await Promise.all([
                    fetch("/api/admin/dashboard/productos"),
                    fetch("/api/admin/dashboard/productos/categorias"),
                ]);

                const menuData = await menuRes.json();
                const catData = await catRes.json();

                if (!menuRes.ok || !menuData.success) {
                    throw new Error(menuData.error || "No se pudo cargar el catalogo");
                }

                if (!catRes.ok || !catData.success) {
                    throw new Error(catData.error || "No se pudieron cargar las categorias");
                }

                setMenuItems(menuData.data);
                setCategories(catData.data);
            } catch (error) {
                console.error("Error loading catalog:", error);
                toast.error("Error al cargar el catalogo");
            } finally {
                setLoadingCatalog(false);
            }
        };

        loadCatalog();
    }, []);

    const operationalMenuItems = useMemo(
        () =>
            menuItems.filter((item) => {
                if (!item.activo) {
                    return false;
                }

                if (item.type === "PRODUCTO") {
                    return item.disponible;
                }

                return true;
            }),
        [menuItems]
    );

    const categoryOptions = useMemo<CategoryOption[]>(() => {
        const mapped = categories
            .map((category) => {
                const totalItems = operationalMenuItems.filter((item) => (item.categoryIds ?? [item.categoryId]).includes(category.id)).length;

                return {
                    id: category.id,
                    nombre: category.nombre,
                    description: totalItems === 1 ? "1 opcion disponible" : `${totalItems} opciones disponibles`,
                    totalItems,
                };
            })
            .filter((category) => category.totalItems > 0);

        const uncategorizedPromos = operationalMenuItems.filter(
            (item) => item.type === "PROMOCION" && (item.categoryIds?.length ?? 0) === 0
        );

        if (uncategorizedPromos.length > 0) {
            mapped.push({
                id: UNCATEGORIZED_PROMOS_ID,
                nombre: "Promociones",
                description: uncategorizedPromos.length === 1 ? "1 promocion sin categoria" : `${uncategorizedPromos.length} promociones sin categoria`,
                totalItems: uncategorizedPromos.length,
            });
        }

        return mapped;
    }, [categories, operationalMenuItems]);

    const selectedCategory = categoryOptions.find((category) => category.id === selectedCategoryId) ?? null;

    const visibleItems = useMemo(() => {
        if (!selectedCategoryId) {
            return [];
        }

        return operationalMenuItems.filter((item) => {
            const itemCategoryIds = item.categoryIds ?? [item.categoryId];
            const matchesCategory =
                selectedCategoryId === UNCATEGORIZED_PROMOS_ID
                    ? item.type === "PROMOCION" && itemCategoryIds.length === 0
                    : itemCategoryIds.includes(selectedCategoryId);

            const matchesSearch =
                productQuery.trim().length === 0 ||
                item.nombre.toLowerCase().includes(productQuery.toLowerCase()) ||
                item.categoria.toLowerCase().includes(productQuery.toLowerCase());

            return matchesCategory && matchesSearch;
        });
    }, [operationalMenuItems, productQuery, selectedCategoryId]);

    const total = useMemo(() => cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0), [cart]);

    const addToCart = (item: MenuItem) => {
        setCart((prev) => {
            const existing = prev.find((cartItem) => cartItem.productId === item.id);
            if (existing) {
                return prev.map((cartItem) =>
                    cartItem.productId === item.id ? { ...cartItem, cantidad: cartItem.cantidad + 1 } : cartItem
                );
            }

            return [
                ...prev,
                {
                    productId: item.id,
                    nombre: item.nombre,
                    cantidad: 1,
                    precio: item.precio,
                    type: item.type,
                },
            ];
        });
    };

    const handleSelectMenuItem = (item: MenuItem) => {
        addToCart(item);
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart((prev) =>
            prev.map((item) =>
                item.productId === productId ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item
            )
        );
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
    };

    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast.error("El carrito esta vacio");
            return;
        }

        setSubmitting(true);
        try {
            const result = await createOrder({
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
                })),
            });

            if (result.success) {
                toast.success("Pedido creado correctamente");
                router.push("/empleado/pedidos");
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

    return (
        <div className="app-page-safe-bottom flex min-h-screen flex-col gap-5 bg-white px-4 py-4 sm:px-6 md:gap-6 md:px-8 md:py-8">
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                    <Link href="/empleado/pedidos" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-900">
                        <ChevronLeft className="h-4 w-4" />
                        Volver a pedidos
                    </Link>

                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Nuevo Pedido</h1>
                        <p className="mt-1 text-sm text-zinc-500 sm:text-base">Primero elige una categoria y luego agrega productos o promociones.</p>
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={submitting || cart.length === 0}
                    className="h-11 rounded-2xl bg-zinc-900 px-5 font-bold text-white shadow-lg shadow-zinc-200 hover:bg-zinc-800 md:h-12 md:px-6"
                >
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Confirmar Pedido
                </Button>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_360px]">
                <div className="space-y-5">
                    <article className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Cliente (opcional)</Label>
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    placeholder="Buscar cliente por nombre o telefono..."
                                    className="h-12 rounded-2xl border-zinc-200 pl-10"
                                    value={selectedCustomer ? selectedCustomer.nombre : customerQuery}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setSelectedCustomer(null);
                                        setCustomerQuery(value);
                                        setClienteNombre(value);
                                    }}
                                />
                                {selectedCustomer && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCustomer(null);
                                            setClienteNombre("");
                                            setClienteTelefono("");
                                            setClienteDireccion("");
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {!selectedCustomer && (
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
                        )}

                        {customers.length > 0 && !selectedCustomer && (
                            <div className="relative mt-3">
                                <div className="absolute z-20 w-full rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                                    {customers.map((customer) => (
                                        <button
                                            key={customer.id}
                                            type="button"
                                            onClick={() => setSelectedCustomer(customer)}
                                            className="flex w-full flex-col gap-0.5 rounded-xl p-3 text-left transition-colors hover:bg-zinc-50"
                                        >
                                            <span className="font-semibold text-zinc-900">{customer.nombre}</span>
                                            <span className="text-xs text-zinc-500">{customer.telefono || customer.email || "Sin contacto"}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>

                    <article className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Paso 1</p>
                                <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950">Categorias</h2>
                                <p className="mt-1 text-sm text-zinc-500">Selecciona la seccion del menu desde la que vas a cargar items.</p>
                            </div>
                            {selectedCategory && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedCategoryId(null);
                                        setProductQuery("");
                                    }}
                                    className="rounded-2xl border-zinc-200"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Cambiar categoria
                                </Button>
                            )}
                        </div>

                        {loadingCatalog ? (
                            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="h-32 animate-pulse rounded-[1.75rem] bg-zinc-100" />
                                ))}
                            </div>
                        ) : selectedCategory ? (
                            <div className="mt-6 space-y-4">
                                <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Categoria seleccionada</p>
                                    <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-950">{selectedCategory.nombre}</h3>
                                    <p className="mt-1 text-sm text-zinc-500">{selectedCategory.description}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Paso 2</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                        <Input
                                            placeholder="Buscar dentro de la categoria..."
                                            className="h-12 rounded-2xl border-zinc-200 pl-10"
                                            value={productQuery}
                                            onChange={(event) => setProductQuery(event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {visibleItems.length === 0 ? (
                                        <div className="col-span-full rounded-[1.75rem] border border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-12 text-center">
                                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-300 shadow-sm">
                                                <Search className="h-6 w-6" />
                                            </div>
                                            <p className="font-semibold text-zinc-900">No encontramos items para esa busqueda</p>
                                            <p className="mt-1 text-sm text-zinc-500">Prueba con otro nombre o cambia de categoria.</p>
                                        </div>
                                    ) : (
                                        visibleItems.map((item) => (
                                            <Card
                                                key={item.id}
                                                className="overflow-hidden rounded-[1.75rem] border-zinc-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg"
                                            >
                                                <button type="button" onClick={() => handleSelectMenuItem(item)} className="block w-full text-left">
                                                    <CardContent className="p-0">
                                                        <div className="relative aspect-[4/3] bg-zinc-100">
                                                            {item.imagen ? (
                                                                <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="(min-width: 1280px) 280px, (min-width: 640px) 50vw, 100vw" unoptimized />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center">
                                                                    <ShoppingBag className="h-8 w-8 text-zinc-300" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-3 p-4">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
                                                                            {item.type === "PROMOCION" ? "Promocion" : "Producto"}
                                                                        </Badge>
                                                                    </div>
                                                                    <h3 className="mt-2 line-clamp-2 text-base font-black tracking-tight text-zinc-950">{item.nombre}</h3>
                                                                </div>
                                                                <Badge className="rounded-full bg-zinc-900 px-3 py-1 text-sm font-black text-white hover:bg-zinc-900">
                                                                    {formatPrice(item.precio)}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-zinc-500">{item.categoryNames?.join(", ") || item.categoria}</p>
                                                        </div>
                                                    </CardContent>
                                                </button>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {categoryOptions.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => setSelectedCategoryId(category.id)}
                                        className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50/70 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-lg"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Categoria</p>
                                                <h3 className="mt-2 truncate text-lg font-black tracking-tight text-zinc-950">{category.nombre}</h3>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-400 shadow-sm">
                                                <ShoppingBag className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <p className="mt-4 text-sm text-zinc-500">{category.description}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </article>
                </div>

                <aside className="rounded-[2rem] border border-zinc-200 bg-white shadow-sm xl:sticky xl:top-6 xl:h-fit">
                    <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Carrito</p>
                            <h2 className="mt-1 text-lg font-black tracking-tight text-zinc-950">{cart.length} item(s)</h2>
                        </div>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {formatPrice(total)}
                        </Badge>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto px-5 py-4">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
                                    <ShoppingBag className="h-8 w-8 text-zinc-300" />
                                </div>
                                <p className="font-semibold text-zinc-900">El carrito esta vacio</p>
                                <p className="mt-1 text-sm text-zinc-500">Selecciona una categoria y agrega items para comenzar.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.productId} className="rounded-[1.5rem] bg-zinc-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-zinc-900">{item.nombre}</p>
                                                <p className="mt-1 text-sm text-zinc-500">{formatPrice(item.precio)} c/u</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.productId)}
                                                className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white hover:text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(item.productId, -1)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-50"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center text-sm font-black text-zinc-950">{item.cantidad}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(item.productId, 1)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-50"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            <p className="text-sm font-black text-zinc-950">{formatPrice(item.precio * item.cantidad)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-zinc-100 px-5 py-4">
                        <div className="flex items-center justify-between text-sm font-medium text-zinc-500">
                            <span>Total</span>
                            <span className="text-lg font-black text-zinc-950">{formatPrice(total)}</span>
                        </div>
                        <p className="mt-3 text-xs text-zinc-400">El pedido se registra igual que hoy; solo cambia la forma de seleccionar los items.</p>
                    </div>
                </aside>
            </section>
        </div>
    );
}

function formatPrice(value: number) {
    return `$${Number(value).toLocaleString("es-AR")}`;
}
