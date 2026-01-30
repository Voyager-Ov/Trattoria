"use client";

import { useCart } from "@/providers/CartProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function CartDrawer() {
    const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="default"
                    className="h-14 rounded-full px-6 flex items-center gap-3 bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all border-none"
                >
                    <div className="relative">
                        <ShoppingCart className="h-6 w-6" />
                        {totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-primary">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] opacity-80 font-medium uppercase tracking-wider">Tu Carrito</span>
                        <span className="text-sm font-bold">${totalPrice.toLocaleString('es-CL')}</span>
                    </div>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 bg-background border-none rounded-l-[2rem]">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                        </div>
                        <SheetTitle className="text-2xl font-bold font-outfit">Mi Pedido</SheetTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">Revisa tus productos antes de confirmar</p>
                </SheetHeader>

                <div className="flex-1 overflow-hidden px-6 my-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center">
                                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-lg">Tu carrito está vacío</p>
                                <p className="text-sm text-muted-foreground">Explora nuestro menú y agrega tus platos favoritos</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 group">
                                    <div className="h-20 w-20 rounded-2xl overflow-hidden bg-secondary/30 flex-shrink-0">
                                        <img
                                            src={item.imagen || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200"}
                                            alt={item.nombre}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div className="flex justify-between gap-2">
                                            <h4 className="font-bold text-sm leading-tight line-clamp-2">{item.nombre}</h4>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background transition-colors"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-bold font-outfit">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <span className="font-bold text-primary">
                                                ${(Number(item.precio) * item.quantity).toLocaleString('es-CL')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 bg-secondary/30 rounded-t-[2.5rem] space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>${totalPrice.toLocaleString('es-CL')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Envío</span>
                                <span className="text-green-600 font-medium">Gratis</span>
                            </div>
                            <Separator className="bg-border/50 my-2" />
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold">Total</span>
                                <span className="text-2xl font-bold font-outfit text-primary">${totalPrice.toLocaleString('es-CL')}</span>
                            </div>
                        </div>

                        <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                            Continuar Pedido
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
