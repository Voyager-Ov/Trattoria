"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Image as ImageIcon, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getEmployeeProductById,
    getEmployeeProductCategories,
    updateEmployeeProductBasics,
} from "../../actions";

type Category = {
    id: string;
    nombre: string;
    esPromocion?: boolean;
};

type Product = {
    id: string;
    nombre: string;
    descripcion: string | null;
    precio: number | string;
    imagen: string | null;
    categoryId: string;
    recipeItems?: { supplyId: string; supply?: { nombre: string } }[];
};

export default function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [product, setProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        categoryId: "",
        imagen: null as string | null,
    });

    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const [categoriesResponse, productResponse] = await Promise.all([
                getEmployeeProductCategories(),
                getEmployeeProductById(id),
            ]);

            if (categoriesResponse.success) {
                setCategories(((categoriesResponse.data as Category[]) ?? []).filter((category) => !category.esPromocion));
            }

            if (!productResponse.success || !productResponse.data) {
                toast.error(productResponse.error || "Producto no encontrado");
                router.replace("/empleado/productos");
                return;
            }

            const productData = productResponse.data as Product;
            setProduct(productData);
            setFormData({
                nombre: productData.nombre,
                descripcion: productData.descripcion || "",
                categoryId: productData.categoryId,
                imagen: productData.imagen,
            });
        } catch (error) {
            console.error("Error loading employee product editor:", error);
            toast.error("Error al cargar el producto");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const recipeCount = useMemo(() => product?.recipeItems?.length ?? 0, [product]);

    function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
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

        if (!formData.categoryId) {
            toast.error("Selecciona una categoria");
            return;
        }

        setSaving(true);
        const result = await updateEmployeeProductBasics(id, {
            nombre: formData.nombre,
            descripcion: formData.descripcion || undefined,
            categoryId: formData.categoryId,
            imagen: formData.imagen,
        });

        if (result.success) {
            toast.success("Ficha del producto actualizada");
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

    if (!product) {
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
                        <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Editar ficha de producto</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                            Esta vista del empleado solo permite ajustar informacion visible en el catalogo. Precio y receta quedan bloqueados.
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
                        <div className="relative mt-4 aspect-square overflow-hidden rounded-[1.75rem] border-2 border-dashed border-zinc-200 bg-zinc-50">
                            {formData.imagen ? (
                                <>
                                    <Image src={formData.imagen} alt={formData.nombre} fill className="object-cover" sizes="360px" unoptimized />
                                    <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={handleImageUpload} />
                                </>
                            ) : (
                                <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-3 text-zinc-400">
                                    <ImageIcon className="h-8 w-8" />
                                    <span className="text-sm font-semibold">Subir imagen</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-zinc-200 bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-200">
                        <Badge className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-white/10">
                            Solo lectura
                        </Badge>
                        <div className="mt-5 space-y-4">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/50">Precio actual</p>
                                <p className="mt-2 text-2xl font-black tracking-tight">
                                    ${Number(product.precio).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/50">Receta asociada</p>
                                <p className="mt-2 text-lg font-black tracking-tight">{recipeCount} insumos</p>
                                <p className="mt-1 text-sm text-white/60">Para cambios de costos o receta se usa el panel admin.</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="nombre" className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                Nombre
                            </Label>
                            <Input
                                id="nombre"
                                value={formData.nombre}
                                onChange={(event) => setFormData((current) => ({ ...current, nombre: event.target.value }))}
                                className="h-12 rounded-2xl border-zinc-200"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Categoria</Label>
                            <Select value={formData.categoryId} onValueChange={(value) => setFormData((current) => ({ ...current, categoryId: value }))}>
                                <SelectTrigger className="h-12 rounded-2xl border-zinc-200">
                                    <SelectValue placeholder="Selecciona una categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="descripcion" className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                Descripcion
                            </Label>
                            <Textarea
                                id="descripcion"
                                value={formData.descripcion}
                                onChange={(event) => setFormData((current) => ({ ...current, descripcion: event.target.value }))}
                                className="min-h-[140px] rounded-2xl border-zinc-200"
                                placeholder="Describe el producto para el catalogo"
                            />
                        </div>
                    </div>
                </section>
            </form>
        </div>
    );
}
