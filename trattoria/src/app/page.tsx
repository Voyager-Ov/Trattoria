"use client";

import { useCart } from "@/providers/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, User, Menu, Pizza, Coffee, IceCream, Plus, Loader2, Tag, Percent } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Category, Product } from "@prisma/client";
import { MenuSkeleton } from "@/components/menu/MenuSkeleton";

type Promotion = {
    id: string;
    name: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    imagen: string | null;
    isActive: boolean;
    items: {
        id: string;
        quantity: number;
        product: Product;
    }[];
};

type MenuItem = {
    id: string;
    type: 'PRODUCTO' | 'PROMOCION';
    nombre: string;
    descripcion: string | null;
    precio: number;
    imagen: string | null;
    stockActual?: number;
    categoryId?: string;
    promotion?: Promotion;
    savingsAmount?: number;
};

export default function CatalogPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Todas');
    const [searchQuery, setSearchQuery] = useState("");
    const { addItem } = useCart();
    const { userData } = useAuth();

    const dashboardHref = userData
        ? (userData.rol === 'ADMIN' ? '/admin/dashboard' : '/empleado')
        : '/login';

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [catRes, prodRes, promoRes] = await Promise.all([
                fetch('/api/categorias').then(res => res.json()),
                fetch('/api/productos').then(res => res.json()),
                fetch('/api/promociones').then(res => res.json())
            ]);

            if (catRes.success) setCategories(catRes.data as Category[]);
            if (prodRes.success) setProducts(prodRes.data as Product[]);
            if (promoRes.success) setPromotions(promoRes.data as Promotion[]);
        } catch (error) {
            console.error("Error fetching menu data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Combinar productos y promociones en un solo array
    const menuItems: MenuItem[] = [
        ...products.map(p => ({
            id: p.id,
            type: 'PRODUCTO' as const,
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: Number(p.precio),
            imagen: p.imagen,
            stockActual: p.stockActual,
            categoryId: p.categoryId
        })),
        ...promotions.map(promo => {
            const totalOriginal = promo.items.reduce((sum, item) => 
                sum + (Number(item.product.precio) * item.quantity), 0);
            
            const finalPrice = promo.discountType === 'PERCENTAGE'
                ? totalOriginal * (1 - Number(promo.discountValue) / 100)
                : totalOriginal - Number(promo.discountValue);

            const savingsAmount = totalOriginal - finalPrice;

            return {
                id: promo.id,
                type: 'PROMOCION' as const,
                nombre: promo.name,
                descripcion: promo.description,
                precio: finalPrice,
                imagen: promo.imagen,
                promotion: promo,
                savingsAmount: savingsAmount
            };
        })
    ];

    const filteredItems = menuItems.filter(item => {
        if (item.type === 'PRODUCTO') {
            const category = categories.find(c => c.id === item.categoryId);
            const matchesCategory = activeCategory === 'Todas' || (category && category.nombre === activeCategory);
            const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        } else {
            // Promociones siempre se muestran en "Todas"
            const matchesCategory = activeCategory === 'Todas';
            const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        }
    });

    const handleAddToCart = (item: MenuItem) => {
        if (item.type === 'PRODUCTO') {
            const product = products.find(p => p.id === item.id);
            if (product) {
                addItem(product);
                toast.success(`${item.nombre} agregado al carrito`, {
                    duration: 2000,
                    position: 'top-center'
                });
            }
        } else {
            toast.info('Las promociones se agregarán próximamente', {
                duration: 2000,
                position: 'top-center'
            });
        }
    };

    if (isLoading) {
        return <MenuSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 pb-20">
            {/* Mobile Header - Sticky */}
            <header className="sticky top-0 z-50 bg-[#E30909] backdrop-blur-md shadow-xl">
                <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between gap-3">
                    <Link href="/" className="flex-shrink-0">
                        <img 
                            src="/tratologo.png" 
                            alt="Trattoria" 
                            className="h-14 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-200"
                        />
                    </Link>

                    <div className="flex-1 max-w-[180px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input
                                type="search"
                                placeholder="Buscar..."
                                className="pl-9 h-9 rounded-full bg-white border-2 border-white/90 focus:ring-2 focus:ring-white/50 text-zinc-900 placeholder:text-zinc-400 font-medium shadow-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <Link href={dashboardHref} className="flex-shrink-0">
                        <Button variant="ghost" size="icon" className="rounded-full text-white hover:text-white hover:bg-white/20 transition-all hover:scale-110">
                            <User className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                {/* Categories Scroll */}
                <div className="max-w-md mx-auto overflow-x-auto pb-4 pt-1 px-4 scrollbar-hide">
                    <div className="flex gap-2 w-max">
                        <button
                            onClick={() => setActiveCategory('Todas')}
                            className={`
                flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 border-2
                ${activeCategory === 'Todas'
                                    ? 'bg-white text-[#CB0101] border-white shadow-lg scale-105'
                                    : 'bg-transparent text-white border-white/60 hover:bg-white/10 hover:border-white hover:scale-105'}
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
                  flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 border-2
                  ${activeCategory === cat.nombre
                                        ? 'bg-white text-[#CB0101] border-white shadow-lg scale-105'
                                        : 'bg-transparent text-white border-white/60 hover:bg-white/10 hover:border-white hover:scale-105'}
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

            {/* Decorative Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-[#CB0101]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-[15%] left-[-5%] w-[50%] h-[50%] bg-zinc-200/40 rounded-full blur-3xl" />
            </div>

            {/* Main Content */}
            <main className="max-w-md mx-auto px-4 py-6 space-y-6">

                {/* Promotional Banner */}
                {activeCategory === 'Todas' && !searchQuery && categories.some(c => c.esPromocion) && (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#CB0101] to-[#A00101] text-white p-6 shadow-xl mb-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                        <div className="relative z-10">
                            <span className="inline-block px-3 py-1.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm mb-3 border border-white/30">
                                🔥 Promociones Especiales
                            </span>
                            <h2 className="text-2xl font-bold leading-tight mb-2">¡Descubrí nuestras<br />ofertas del día!</h2>
                            <p className="text-white/90 text-sm mb-4 max-w-[85%]">
                                Combiná tus favoritos y aprovechá los mejores precios
                            </p>
                            <Button
                                onClick={() => {
                                    const promoCat = categories.find(c => c.esPromocion);
                                    if (promoCat) setActiveCategory(promoCat.nombre);
                                }}
                                size="sm"
                                className="bg-white text-[#CB0101] hover:bg-white/90 rounded-xl font-bold px-6 shadow-lg"
                            >
                                Ver Promociones
                            </Button>
                        </div>
                    </div>
                )}

                {/* Section Title */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-zinc-900">
                        {activeCategory === 'Todas' ? 'Nuestro Menú' : activeCategory}
                    </h3>
                    <span className="text-xs text-zinc-600 font-semibold bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200">
                        {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                    </span>
                </div>

                {/* Products & Promotions Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className={`group relative bg-white rounded-2xl p-4 flex gap-4 border transition-all hover:shadow-xl active:scale-[0.98] ${
                                item.type === 'PROMOCION' 
                                    ? 'border-amber-200 hover:border-amber-300 hover:shadow-amber-100'
                                    : 'border-zinc-200 hover:border-[#CB0101]/30 hover:shadow-[#CB0101]/5'
                            }`}
                        >
                            {/* Badge for Promotions */}
                            {item.type === 'PROMOCION' && (
                                <Badge className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-400 to-amber-500 text-white border-none font-bold text-[0.65rem] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                    <Percent className="h-3 w-3" />
                                    PROMO
                                </Badge>
                            )}

                            {/* Item Image */}
                            <div className="h-28 w-28 flex-shrink-0 relative rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100">
                                <img
                                    src={item.imagen || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"}
                                    alt={item.nombre}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400";
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-1 justify-between py-1">
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-zinc-900 text-base leading-tight">{item.nombre}</h4>
                                    </div>
                                    
                                    {item.type === 'PRODUCTO' ? (
                                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                                            {item.descripcion}
                                        </p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <p className="text-xs text-zinc-500 line-clamp-1 leading-relaxed">
                                                {item.descripcion || 'Combo especial'}
                                            </p>
                                            {item.promotion && (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.promotion.items.slice(0, 3).map((promoItem) => (
                                                        <Badge 
                                                            key={promoItem.id} 
                                                            variant="outline" 
                                                            className="text-[0.65rem] px-1.5 py-0.5 border-amber-200 text-zinc-700 bg-amber-50"
                                                        >
                                                            {promoItem.quantity}x {promoItem.product.nombre}
                                                        </Badge>
                                                    ))}
                                                    {item.promotion.items.length > 3 && (
                                                        <Badge variant="outline" className="text-[0.65rem] px-1.5 py-0.5 border-amber-200 text-zinc-700 bg-amber-50">
                                                            +{item.promotion.items.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-end justify-between mt-3">
                                    <div className="flex flex-col">
                                        {item.type === 'PROMOCION' && item.promotion && (
                                            <span className="text-xs text-zinc-400 line-through font-medium">
                                                ${(item.promotion.items.reduce((sum, i) => 
                                                    sum + (Number(i.product.precio) * i.quantity), 0)).toLocaleString('es-CL')}
                                            </span>
                                        )}
                                        <span className={`text-2xl font-bold ${
                                            item.type === 'PROMOCION' ? 'text-amber-500' : 'text-[#CB0101]'
                                        }`}>
                                            ${item.precio.toLocaleString('es-CL')}
                                        </span>
                                        {item.type === 'PRODUCTO' && item.stockActual && item.stockActual <= 5 && item.stockActual > 0 && (
                                            <span className="text-[10px] text-amber-600 font-bold uppercase mt-1">¡Últimas unidades!</span>
                                        )}
                                        {item.type === 'PROMOCION' && item.promotion && (
                                            <span className="text-[10px] text-emerald-600 font-bold uppercase mt-1">
                                                Ahorrás ${Number(item.savingsAmount).toLocaleString('es-CL')}
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        size="icon"
                                        onClick={() => handleAddToCart(item)}
                                        className={`h-11 w-11 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 ${
                                            item.type === 'PROMOCION'
                                                ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white hover:from-amber-500 hover:to-amber-600'
                                                : 'bg-[#CB0101] text-white hover:bg-[#A00101]'
                                        }`}
                                    >
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredItems.length === 0 && (
                        <div className="text-center py-16 text-zinc-400 bg-white rounded-2xl border border-zinc-200">
                            <p className="font-medium text-lg">No encontramos productos en esta categoría</p>
                            <p className="text-sm mt-1">Probá buscando en otra categoría</p>
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
