"use client";

import { useCart } from "@/providers/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, User, Menu, Pizza, Coffee, IceCream, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Category, Product } from "@prisma/client";
import { MenuSkeleton } from "@/components/menu/MenuSkeleton";

export default function CatalogPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Todas');
    const [searchQuery, setSearchQuery] = useState("");
    const { addItem } = useCart();

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [catRes, prodRes] = await Promise.all([
                fetch('/api/categorias').then(res => res.json()),
                fetch('/api/productos').then(res => res.json())
            ]);

            if (catRes.success) setCategories(catRes.data as Category[]);
            if (prodRes.success) setProducts(prodRes.data as Product[]);
        } catch (error) {
            console.error("Error fetching menu data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const filteredProducts = products.filter(product => {
        const category = categories.find(c => c.id === product.categoryId);
        const matchesCategory = activeCategory === 'Todas' || (category && category.nombre === activeCategory);
        const matchesSearch = product.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAddToCart = (product: Product) => {
        addItem(product);
        toast.success(`${product.nombre} agregado al carrito`, {
            duration: 2000,
            position: 'top-center'
        });
    };

    if (isLoading) {
        return <MenuSkeleton />;
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Mobile Header - Sticky */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="font-outfit font-bold text-xl text-primary tracking-tight">
                        Trattoria
                    </div>

                    <div className="flex-1 max-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar..."
                                className="pl-9 h-9 rounded-full bg-secondary/50 border-none focus:ring-1 focus:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full text-foreground/80 hover:text-primary hover:bg-primary/10">
                            <User className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                {/* Categories Scroll */}
                <div className="max-w-md mx-auto overflow-x-auto pb-3 px-4 scrollbar-hide">
                    <div className="flex gap-2 w-max">
                        <button
                            onClick={() => setActiveCategory('Todas')}
                            className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                ${activeCategory === 'Todas'
                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-secondary/50'}
              `}
                        >
                            <Menu className="h-4 w-4" />
                            Todas
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.nombre)}
                                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                  ${activeCategory === cat.nombre
                                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                                        : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-secondary/50'}
                `}
                            >
                                {cat.imagen && (
                                    <img
                                        src={cat.imagen}
                                        alt=""
                                        className="h-4 w-4 object-cover rounded-full"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                )}
                                {cat.nombre}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Decorative Background Blobs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/3 rounded-full blur-3xl opacity-60" />
                <div className="absolute bottom-[20%] left-[-10%] w-[60%] h-[60%] bg-secondary/40 rounded-full blur-3xl opacity-60" />
            </div>

            {/* Main Content */}
            <main className="max-w-md mx-auto px-4 py-6 space-y-6">

                {/* Promotional Banner (Mobile First Hero) */}
                {activeCategory === 'Todas' && !searchQuery && categories.some(c => c.esPromocion) && (
                    <div className="relative overflow-hidden rounded-[2rem] bg-primary text-primary-foreground p-6 shadow-xl shadow-primary/20 mb-8 border-4 border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                        <div className="relative z-10">
                            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm mb-3">
                                Promociones 🔥
                            </span>
                            <h2 className="text-2xl font-bold leading-tight mb-2">¡Descubre nuestras<br />ofertas especiales!</h2>
                            <p className="text-primary-foreground/90 text-sm mb-4 max-w-[80%]">
                                Explora la sección de promociones para encontrar los mejores combos.
                            </p>
                            <Button
                                onClick={() => {
                                    const promoCat = categories.find(c => c.esPromocion);
                                    if (promoCat) setActiveCategory(promoCat.nombre);
                                }}
                                size="sm"
                                className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold px-6 shadow-lg"
                            >
                                Ver Promos
                            </Button>
                        </div>
                    </div>
                )}

                {/* Section Title */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">
                        {activeCategory === 'Todas' ? 'Nuestro Menú' : activeCategory}
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium bg-secondary/50 px-2 py-1 rounded-lg">
                        {filteredProducts.length} productos
                    </span>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="group relative bg-card rounded-[1.5rem] p-3 flex gap-4 border border-border/60 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99] overflow-hidden"
                        >
                            {/* Product Image */}
                            <div className="h-28 w-28 flex-shrink-0 relative rounded-2xl overflow-hidden bg-secondary/30">
                                <img
                                    src={product.imagen || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"}
                                    alt={product.nombre}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-1 justify-between py-1">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-foreground text-lg leading-tight mb-1">{product.nombre}</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {product.descripcion}
                                    </p>
                                </div>

                                <div className="flex items-end justify-between mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold text-primary font-outfit">
                                            ${Number(product.precio).toLocaleString('es-CL')}
                                        </span>
                                        {product.stockActual <= 5 && product.stockActual > 0 && (
                                            <span className="text-[10px] text-amber-600 font-bold uppercase mt-1">¡Quedan pocos!</span>
                                        )}
                                    </div>
                                    <Button
                                        size="icon"
                                        onClick={() => handleAddToCart(product)}
                                        className="h-9 w-9 rounded-xl bg-foreground text-background hover:bg-primary hover:text-white transition-colors shadow-md"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No encontramos productos en esta categoría :(</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Navigation (Floating Cart) */}
            <div className="fixed bottom-6 left-0 right-0 px-4 z-40 pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto flex justify-center">
                    <CartDrawer />
                </div>
            </div>
        </div>
    );
}
