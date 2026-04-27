"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Image as ImageIcon, Loader2, Save, Tag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    getEmployeeProductCategories,
    getEmployeePromotionById,
    updateEmployeePromotionBasics,
} from "../../../actions";

type Category = {
    id: string;
    nombre: string;
};

type Promotion = {
    id: string;
    name: string;
    description: string | null;
    imagen: string | null;
    categories: Category[];
    items: { productId: string; quantity: number; product: { nombre: string; precio: number | string } }[];
    discountType: string;
    discountValue: number | string;
};

export default function EditarPromocionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [promotion, setPromotion] = useState<Promotion | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        imagen: null as string | null,
    });
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const [categoriesResponse, promotionResponse] = await Promise.all([
                getEmployeeProductCategories(),
                getEmployeePromotionById(id),
            ]);

            if (categoriesResponse.success) {
                setCategories((categoriesResponse.data as Category[]) ?? []);
            }

            if (!promotionResponse.success || !promotionResponse.data) {
                toast.error(promotionResponse.error || "Promocion no encontrada");
                router.replace("/empleado/productos");
                return;
            }

            const promotionData = promotionResponse.data as Promotion;
            setPromotion(promotionData);
            setFormData({
                name: promotionData.name,
                description: promotionData.description || "",
                imagen: promotionData.imagen,
            });
            setSelectedCategoryIds(promotionData.categories.map((category) => category.id));
        } catch (error) {
            console.error("Error loading employee promotion editor:", error);
            toast.error("Error al cargar la promocion");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const currentFinalPrice = useMemo(() => {
        if (!promotion) {
            return 0;
        }

        const originalTotal = promotion.items.reduce(
            (total, item) => total + Number(item.product.precio) * Number(item.quantity),
            0
        );

        if (promotion.discountType === "PERCENTAGE") {
            return originalTotal * (1 - Number(promotion.discountValue) / 100);
        }

        return originalTotal - Number(promotion.discountValue || 0);
    }, [promotion]);

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData((current) => ({ ...current, imagen: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        setSaving(true);
        const result = await updateEmployeePromotionBasics(id, {
            name: formData.name,
            description: formData.description || undefined,
            imagen: formData.imagen,
            categoryIds: selectedCategoryIds,
        });

        if (result.success) {
            toast.success("Ficha de la promocion actualizada");
            router.push("/empleado/productos");
            router.refresh();
        } else {
            toast.error(result.error || "Error al guardar cambios");
        }

        setSaving(false);
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
            </div>
        );
    }

    if (!promotion) {
        return null;
    }

    return (
        <div className="app-page-safe-bottom flex min-h-screen flex-col gap-6 bg-white px-4 py-4 sm:px-6 md:gap-8 md:px-8 md:py-8">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                    <Link href="/empleado/productos" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-900">
                        <ChevronLeft className="h-4 w-4" />
                        Volver al menu
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Editar ficha de promocion</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                            El empleado solo puede actualizar nombre, descripcion, imagen y categorias de exhibicion. El armado y el descuento siguen en admin.
                        </p>
                    </div>
                </div>

                <Button onClick={handleSubmit} disabled={saving} className="h-11 rounded-2xl bg-zinc-950 px-5 font-bold text-white hover:bg-zinc-800">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar cambios
                </Button>
            </section>

            <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="space-y-4">
                    <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
                        <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Imagen</Label>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="relative mt-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.75rem] border-2 border-dashed border-zinc-200 bg-zinc-50"
                        >
                            {formData.imagen ? (
                                <Image src={formData.imagen} alt={formData.name} fill className="object-cover" sizes="360px" unoptimized />
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-zinc-400">
                                    <ImageIcon className="h-8 w-8" />
                                    <span className="text-sm font-semibold">Subir imagen</span>
                                </div>
                            )}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>

                    <div className="rounded-[2rem] border border-zinc-200 bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-200">
                        <Badge className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-white/10">
                            Solo lectura
                        </Badge>
                        <div className="mt-5 space-y-4">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/50">Productos incluidos</p>
                                <p className="mt-2 text-2xl font-black tracking-tight">{promotion.items.length}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/50">Precio final actual</p>
                                <p className="mt-2 text-2xl font-black tracking-tight">
                                    ${currentFinalPrice.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="mt-1 text-sm text-white/60">El descuento se sigue administrando desde el panel de admin.</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="space-y-5">
                    <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
                        <div className="grid gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                    Nombre
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                                    className="h-12 rounded-2xl border-zinc-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                    Descripcion
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                                    className="min-h-[140px] rounded-2xl border-zinc-200"
                                    placeholder="Describe la promo para el catalogo"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                                <Tag className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-zinc-950">Categorias de exhibicion</h2>
                                <p className="mt-1 text-sm text-zinc-500">Define en que categorias del menu se muestra la promocion.</p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            {categories.map((category) => {
                                const selected = selectedCategoryIds.includes(category.id);

                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedCategoryIds((current) =>
                                                current.includes(category.id)
                                                    ? current.filter((categoryId) => categoryId !== category.id)
                                                    : [...current, category.id]
                                            )
                                        }
                                        className={`rounded-full px-4 py-2 text-sm font-black uppercase tracking-[0.14em] transition-all ${
                                            selected
                                                ? "bg-zinc-950 text-white"
                                                : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
                                        }`}
                                    >
                                        {category.nombre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </form>
        </div>
    );
}
