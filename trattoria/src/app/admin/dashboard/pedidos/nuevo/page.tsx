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
    Check
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchCustomers, createOrder } from "../actions";
import { toast } from "sonner";

interface Product {
    id: string;
    nombre: string;
    precio: number;
    categoria: { nombre: string };
    imagen?: string;
    type: 'PRODUCTO' | 'PROMOCION';
}

interface CartItem {
    productId: string;
    nombre: string;
    cantidad: number;
    precio: number;
    type: 'PRODUCTO' | 'PROMOCION';
}

interface Customer {
    id: string;
    nombre: string;
    telefono?: string;
    email?: string;
}

export default function NuevoPedidoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [customerQuery, setCustomerQuery] = useState("");
    const [clienteNombre, setClienteNombre] = useState("");
    const [clienteTelefono, setClienteTelefono] = useState("");
    const [clienteDireccion, setClienteDireccion] = useState("");
    const [activeTab, setActiveTab] = useState<'PRODUCTO' | 'PROMOCION'>('PRODUCTO');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [productQuery, setProductQuery] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
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

    // Search Products (Menu)
    useEffect(() => {
        const fetchProducts = async () => {
            setSearchingProducts(true);
            try {
                const res = await fetch(`/api/admin/dashboard/productos?q=${productQuery}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    // Normalize categoria if it's a string
                    const normalized = data.data.map((p: any) => ({
                        ...p,
                        categoria: typeof p.categoria === 'string' ? { nombre: p.categoria } : p.categoria
                    }));
                    setProducts(normalized);
                } else {
                    setProducts([]);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setSearchingProducts(false);
            }
        };

        const timer = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timer);
    }, [productQuery]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                nombre: product.nombre,
                cantidad: 1,
                precio: product.precio,
                type: product.type
            }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(1, item.cantidad + delta);
                return { ...item, cantidad: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
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
                    type: item.type, // Map the type from the cart item
                    nombreProduct: item.nombre,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio
                }))
            });

            if (result.success) {
                toast.success("Pedido creado correctamente");
                router.push("/admin/dashboard/pedidos");
                router.refresh();
            } else {
                toast.error(result.error || "Error al crear el pedido");
            }
        } catch (error) {
            toast.error("Error inesperado en el servidor");
        } finally {
            setSubmitting(false);
        }
    };

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
                        <div className="flex flex-col justify-between relative">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Cliente (Opcional)</Label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <Input
                                        placeholder="Buscar cliente por nombre o teléfono..."
                                        className="pl-10 h-11 border-zinc-200 focus:ring-zinc-900 rounded-xl"
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
                                            className="h-10 border-zinc-200 rounded-xl"
                                            value={clienteTelefono}
                                            onChange={(e) => setClienteTelefono(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Dirección</Label>
                                        <Input
                                            placeholder="Calle 123, Depto 1"
                                            className="h-10 border-zinc-200 rounded-xl"
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
                                        className="pl-10 h-11 border-zinc-200 focus:ring-zinc-900 rounded-xl"
                                        value={productQuery}
                                        onChange={(e) => setProductQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Type Filter Switcher */}
                            <div className="flex w-full p-1 bg-zinc-100/80 backdrop-blur-sm rounded-xl border border-zinc-200/50 shadow-inner mt-2">
                                <button
                                    onClick={() => setActiveTab('PRODUCTO')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${activeTab === 'PRODUCTO'
                                        ? 'bg-white text-zinc-900 shadow-md ring-1 ring-zinc-200/50'
                                        : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/40'
                                        }`}
                                >
                                    <ShoppingBag className={`h-3.5 w-3.5 ${activeTab === 'PRODUCTO' ? 'text-zinc-900' : 'text-zinc-400'}`} />
                                    Productos
                                </button>
                                <button
                                    onClick={() => setActiveTab('PROMOCION')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${activeTab === 'PROMOCION'
                                        ? 'bg-white text-zinc-900 shadow-md ring-1 ring-zinc-200/50'
                                        : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/40'
                                        }`}
                                >
                                    <Plus className={`h-3.5 w-3.5 ${activeTab === 'PROMOCION' ? 'text-zinc-900' : 'text-zinc-400'}`} />
                                    Promociones
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                            {searchingProducts ? (
                                Array(8).fill(0).map((_, i) => (
                                    <div key={i} className="h-48 bg-zinc-200 animate-pulse rounded-2xl" />
                                ))
                            ) : products.filter(p => p.type === activeTab).length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <div className="bg-zinc-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="h-8 w-8 text-zinc-300" />
                                    </div>
                                    <p className="text-zinc-500 font-medium">No se encontraron {activeTab === 'PRODUCTO' ? 'productos' : 'promociones'}</p>
                                    <p className="text-zinc-400 text-sm">Intenta con otros términos</p>
                                </div>
                            ) : products.filter(p => p.type === activeTab).map(p => (
                                <Card
                                    key={p.id}
                                    className="group overflow-hidden border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all rounded-2xl cursor-pointer"
                                    onClick={() => addToCart(p)}
                                >
                                    <CardContent className="p-0">
                                        <div className="aspect-[4/3] bg-zinc-100 relative">
                                            {p.imagen ? (
                                                <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag className="h-8 w-8 text-zinc-300" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2">
                                                <Badge className="bg-white/90 backdrop-blur-md text-zinc-900 hover:bg-white/90 border-none font-bold">
                                                    ${p.precio}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">
                                                {p.categoria.nombre}
                                            </span>
                                            <h3 className="font-bold text-zinc-900 text-sm line-clamp-1">{p.nombre}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Cart Summary */}
                <div className="w-full md:w-96 bg-white border-l border-zinc-100 flex flex-col">
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                        <h2 className="font-bold text-lg text-zinc-900">Carrito</h2>
                        <Badge variant="outline" className="rounded-full">{cart.length} items</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-100 scrollbar-track-transparent">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                                <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
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
                                    <div key={item.productId} className="flex gap-4 items-center">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-zinc-900 truncate">{item.nombre}</h4>
                                            <p className="text-xs text-zinc-500 font-medium">${item.precio} c/u</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-full border border-zinc-100">
                                            <button
                                                onClick={() => updateQuantity(item.productId, -1)}
                                                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white text-zinc-600 transition-colors"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm font-bold w-6 text-center">{item.cantidad}</span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, 1)}
                                                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white text-zinc-600 transition-colors"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.productId)}
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
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xl font-black text-zinc-900">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
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
