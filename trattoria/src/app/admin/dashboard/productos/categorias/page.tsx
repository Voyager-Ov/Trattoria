"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    MoreVertical,
    Image as ImageIcon,
    Loader2,
    ArrowLeft,
    GripVertical,
    Trash2,
    Edit2,
    CheckCircle2,
    XCircle,
    Save,
    Sparkles,
    Zap
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    getCategories,
    createCategory,
    updateCategory,
    softDeleteCategory,
    reorderCategories
} from "../actions";
import { Category, Prisma } from "@prisma/client";
import { toast } from "sonner";

// Use Category from @prisma/client directly

interface MetricCardProps {
    title: string;
    value: string | number;
    headerColor: string;
    icon?: React.ReactNode;
}

function MetricCard({ title, value, headerColor, icon }: MetricCardProps) {
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow duration-300">
            <div className={`h-12 ${headerColor} flex items-center px-6 text-white font-medium text-sm`}>
                {title}
                {icon && <div className="ml-auto opacity-80">{icon}</div>}
            </div>
            <div className="p-6">
                <span className="text-3xl font-bold text-zinc-900 tracking-tight">{value}</span>
            </div>
        </div>
    );
}

interface SortableRowProps {
    category: Category;
    onToggleActive: (category: Category) => void;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
}

function SortableRow({ category, onToggleActive, onEdit, onDelete }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative' as const,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`group hover:bg-zinc-50/50 transition-colors ${isDragging ? "bg-white shadow-2xl ring-1 ring-zinc-100" : ""}`}
        >
            <td className="px-8 py-4">
                <div className="flex items-center text-zinc-400">
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-2 -ml-2 rounded-md hover:bg-zinc-100 transition-colors cursor-grab active:cursor-grabbing touch-none"
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="ml-1 bg-zinc-100 rounded-lg px-2 py-1 min-w-[1.5rem] flex justify-center items-center">
                        <span className="font-mono text-[10px] font-bold text-zinc-600">{category.orden}</span>
                    </div>
                </div>
            </td>
            <td className="px-8 py-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex-shrink-0 shadow-sm">
                        {category.imagen ? (
                            <img src={category.imagen} alt={category.nombre} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-zinc-300" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 group-hover:text-black transition-colors">{category.nombre}</span>
                            {category.esPromocion && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 gap-1 text-[9px] uppercase font-heavy">
                                    <Sparkles className="h-2 w-2" />
                                    Promos
                                </Badge>
                            )}
                        </div>
                        <span className="text-xs text-zinc-500 line-clamp-1 max-w-[200px]">{category.descripcion || "Sin descripción"}</span>
                    </div>
                </div>
            </td>
            <td className="px-8 py-4 hidden md:table-cell">
                <code className="text-[10px] bg-zinc-100 px-2 py-1 rounded-md text-zinc-600 font-mono">
                    /{category.slug}
                </code>
            </td>
            <td className="px-8 py-4">
                <button
                    onClick={() => onToggleActive(category)}
                    className="focus:outline-none"
                >
                    <Badge variant={category.activo ? "success" : "secondary"} className="rounded-full px-3 py-1 text-[10px] uppercase tracking-wider font-bold">
                        {category.activo ? "Activa" : "Inactiva"}
                    </Badge>
                </button>
            </td>
            <td className="px-8 py-4 text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-zinc-200 transition-colors">
                            <MoreVertical className="h-4 w-4 text-zinc-500" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl border-zinc-100 shadow-xl p-2">
                        <DropdownMenuItem
                            onClick={() => onEdit(category)}
                            className="rounded-xl focus:bg-zinc-50 py-2.5 transition-colors cursor-pointer"
                        >
                            <Edit2 className="h-4 w-4 mr-3 text-zinc-400" />
                            <span className="font-medium">Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onToggleActive(category)}
                            className="rounded-xl focus:bg-zinc-50 py-2.5 transition-colors cursor-pointer"
                        >
                            {category.activo ? (
                                <>
                                    <XCircle className="h-4 w-4 mr-3 text-rose-400" />
                                    <span className="font-medium text-rose-600">Desactivar</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-3 text-emerald-400" />
                                    <span className="font-medium text-emerald-600">Activar</span>
                                </>
                            )}
                        </DropdownMenuItem>
                        <div className="h-[1px] bg-zinc-100 my-1 mx-2" />
                        <DropdownMenuItem
                            onClick={() => onDelete(category.id)}
                            className="rounded-xl focus:bg-rose-50 py-2.5 transition-colors cursor-pointer"
                        >
                            <Trash2 className="h-4 w-4 mr-3 text-rose-500" />
                            <span className="font-medium text-rose-600">Eliminar</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    );
}

export default function CategoriasPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [formState, setFormState] = useState({
        nombre: "",
        descripcion: "",
        slug: "",
        imagen: "",
        activo: true,
        esPromocion: false
    });

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        const res = await getCategories();
        if (res.success && res.data) {
            setCategories(res.data as Category[]);
        } else {
            toast.error(res.error || "Error al cargar categorías");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    useEffect(() => {
        if (editingCategory) {
            setFormState({
                nombre: editingCategory.nombre,
                descripcion: editingCategory.descripcion || "",
                slug: editingCategory.slug,
                imagen: editingCategory.imagen || "",
                activo: editingCategory.activo,
                esPromocion: editingCategory.esPromocion
            });
        } else {
            setFormState({
                nombre: "",
                descripcion: "",
                slug: "",
                imagen: "",
                activo: true,
                esPromocion: false
            });
        }
    }, [editingCategory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const res = editingCategory
            ? await updateCategory(editingCategory.id, formState)
            : await createCategory(formState);

        if (res.success) {
            toast.success(editingCategory ? "Categoría actualizada" : "Categoría creada");
            setIsSheetOpen(false);
            setEditingCategory(null);
            refreshData();
        } else {
            toast.error(res.error || "Error al procesar la solicitud");
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta categoría?")) return;

        const res = await softDeleteCategory(id);
        if (res.success) {
            toast.success("Categoría eliminada");
            refreshData();
        } else {
            toast.error(res.error || "Error al eliminar");
        }
    };

    const handleToggleActive = async (category: Category) => {
        const res = await updateCategory(category.id, { activo: !category.activo });
        if (res.success) {
            toast.success(`Categoría ${!category.activo ? 'activada' : 'desactivada'}`);
            refreshData();
        } else {
            toast.error(res.error || "Error al actualizar estado");
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = categories.findIndex((c) => c.id === active.id);
            const newIndex = categories.findIndex((c) => c.id === over.id);

            const newCategories = arrayMove(categories, oldIndex, newIndex).map((c, index) => ({
                ...c,
                orden: index + 1
            }));
            setCategories(newCategories);

            const updates = newCategories.map((c, index) => ({
                id: c.id,
                orden: index + 1
            }));

            const res = await reorderCategories(updates);
            if (res.success) {
                toast.success("Orden actualizado");
            } else {
                toast.error(res.error || "Error al actualizar el orden");
                refreshData();
            }
        }
    };

    // Auto-generate slug from name
    useEffect(() => {
        if (!editingCategory && formState.nombre) {
            const slug = formState.nombre
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setFormState(prev => ({ ...prev, slug }));
        }
    }, [formState.nombre, editingCategory]);

    const stats = {
        total: categories.length,
        active: categories.filter(c => c.activo).length,
        inactive: categories.filter(c => !c.activo).length
    };

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <Link href="/admin/dashboard/productos" className="text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-2 text-sm font-medium group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Volver a Productos
                    </Link>
                    <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Gestión de Categorías</h1>
                    <p className="text-zinc-500 text-lg">Organiza y personaliza las categorías de tu menú.</p>
                </div>

                <Sheet open={isSheetOpen} onOpenChange={(open) => {
                    setIsSheetOpen(open);
                    if (!open) setEditingCategory(null);
                }}>
                    <SheetTrigger asChild>
                        <Button className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-semibold shadow-lg shadow-zinc-200 h-12 px-8">
                            <Plus className="h-5 w-5 mr-2" />
                            Nueva Categoría
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-xl rounded-l-[3rem] border-zinc-100 overflow-y-auto">
                        <SheetHeader className="mb-8">
                            <SheetTitle className="text-3xl font-bold text-zinc-900">
                                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                            </SheetTitle>
                            <p className="text-zinc-500 text-base">
                                {editingCategory ? "Modifica los detalles de la categoría seleccionada." : "Crea una nueva categoría para organizar tus platos."}
                            </p>
                        </SheetHeader>

                        <form onSubmit={handleSubmit} className="space-y-8 pb-8">
                            <div className="space-y-4">
                                <Label className="text-sm font-bold uppercase tracking-wider text-zinc-400">Información Visual</Label>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="cat-image">Imagen de la Categoría</Label>
                                        <div className="flex items-center gap-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group/img">
                                            <div className="h-24 w-24 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm relative group">
                                                {formState.imagen ? (
                                                    <img src={formState.imagen} alt="Preview" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                                ) : (
                                                    <ImageIcon className="h-10 w-10 text-zinc-300" />
                                                )}
                                                {formState.imagen && (
                                                    <div
                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                                        onClick={() => setFormState(prev => ({ ...prev, imagen: "" }))}
                                                    >
                                                        <Trash2 className="h-6 w-6 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                                    Sube una imagen representativa. Se recomienda formato cuadrado (1:1).
                                                </p>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        id="cat-image"
                                                        accept="image/*"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setFormState(prev => ({ ...prev, imagen: reader.result as string }));
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                    <Button variant="outline" className="w-full rounded-xl border-zinc-200 h-10 font-bold text-xs gap-2 bg-white">
                                                        <Plus className="h-3 w-3" />
                                                        Seleccionar Imagen
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-sm font-bold uppercase tracking-wider text-zinc-400">Detalles de la Categoría</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="cat-nombre">Nombre de la Categoría</Label>
                                        <Input
                                            id="cat-nombre"
                                            placeholder="Ej: Pastas Artesanales"
                                            className="rounded-xl border-zinc-200 h-11 text-base font-bold"
                                            value={formState.nombre}
                                            onChange={(e) => setFormState({ ...formState, nombre: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2 sm:col-span-1">
                                        <Label htmlFor="cat-slug" className="flex items-center gap-2">
                                            URL Slug
                                            <span className="text-[10px] text-zinc-400 font-normal normal-case">(Identificador Web)</span>
                                        </Label>
                                        <Input
                                            id="cat-slug"
                                            placeholder="pastas-artesanales"
                                            className="rounded-xl border-zinc-200 h-10 bg-zinc-50 font-mono text-xs"
                                            value={formState.slug}
                                            onChange={(e) => setFormState({ ...formState, slug: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="cat-desc">Descripción</Label>
                                        <Textarea
                                            id="cat-desc"
                                            placeholder="Pequeña descripción para el menú..."
                                            className="rounded-xl border-zinc-200 min-h-[80px] text-sm resize-none"
                                            value={formState.descripcion}
                                            onChange={(e) => setFormState({ ...formState, descripcion: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div
                                    onClick={() => setFormState(prev => ({ ...prev, esPromocion: !prev.esPromocion }))}
                                    className={`p-4 rounded-[1.5rem] border-2 transition-all cursor-pointer flex items-center gap-4 group ${formState.esPromocion
                                        ? "border-amber-200 bg-amber-50/50"
                                        : "border-zinc-100 bg-white hover:border-zinc-200"
                                        }`}
                                >
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${formState.esPromocion ? "bg-amber-500 text-white shadow-lg shadow-amber-200 transition-all scale-105" : "bg-zinc-100 text-zinc-400"
                                        }`}>
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`font-bold text-sm transition-colors ${formState.esPromocion ? "text-amber-900" : "text-zinc-900"}`}>
                                                Modo Promociones
                                            </span>
                                            <div className={`w-10 h-5 rounded-full transition-colors relative ${formState.esPromocion ? "bg-amber-500" : "bg-zinc-200"}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formState.esPromocion ? "left-5.5" : "left-0.5"}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2">
                                <Button type="submit" className="w-full rounded-2xl bg-zinc-900 hover:bg-zinc-800 h-12 text-base font-bold shadow-xl shadow-zinc-200 transition-all" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        editingCategory ? "Guardar Cambios" : "Crear Categoría"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Categorías"
                    value={stats.total}
                    headerColor="bg-zinc-900"
                    icon={<GripVertical className="h-4 w-4" />}
                />
                <MetricCard
                    title="Activas"
                    value={stats.active}
                    headerColor="bg-emerald-600"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                />
                <MetricCard
                    title="Inactivas"
                    value={stats.inactive}
                    headerColor="bg-zinc-400"
                    icon={<XCircle className="h-4 w-4" />}
                />
            </div>

            {/* Content */}
            <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <table className="w-full">
                            <thead>
                                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                    <th className="px-8 py-5 text-left text-[0.65rem] font-bold text-zinc-400 uppercase tracking-[0.2em] w-16">Orden</th>
                                    <th className="px-8 py-5 text-left text-[0.65rem] font-bold text-zinc-400 uppercase tracking-[0.2em]">Categoría</th>
                                    <th className="px-8 py-5 text-left text-[0.65rem] font-bold text-zinc-400 uppercase tracking-[0.2em] hidden md:table-cell">Slug</th>
                                    <th className="px-8 py-5 text-left text-[0.65rem] font-bold text-zinc-400 uppercase tracking-[0.2em]">Estado</th>
                                    <th className="px-8 py-5 text-right text-[0.65rem] font-bold text-zinc-400 uppercase tracking-[0.2em]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-zinc-400">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                            Cargando categorías...
                                        </td>
                                    </tr>
                                ) : categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-zinc-400">
                                            No hay categorías registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    <SortableContext
                                        items={categories.map(c => c.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {categories.map((category) => (
                                            <SortableRow
                                                key={category.id}
                                                category={category}
                                                onToggleActive={handleToggleActive}
                                                onEdit={(cat) => {
                                                    setEditingCategory(cat);
                                                    setIsSheetOpen(true);
                                                }}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </SortableContext>
                                )}
                            </tbody>
                        </table>
                        <DragOverlay>
                            {activeId ? (
                                <table className="w-full">
                                    <tbody>
                                        <SortableRow
                                            category={categories.find(c => c.id === activeId)!}
                                            onToggleActive={() => { }}
                                            onEdit={() => { }}
                                            onDelete={() => { }}
                                        />
                                    </tbody>
                                </table>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>
        </div >
    );
}
