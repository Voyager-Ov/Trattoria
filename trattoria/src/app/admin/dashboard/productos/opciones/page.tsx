"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, Loader2, MoreVertical, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductOptionPriceMode } from "@prisma/client";

import {
    createProductOptionGroup,
    createProductOption,
    deleteProductOptionGroup,
    getOptionProductCandidates,
    getProductOptionGroups,
    ProductOptionGroupWithOptions,
    softDeleteProductOption,
    updateProductOptionGroup,
    updateProductOption,
} from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface OptionProductCandidate {
    id: string;
    nombre: string;
}

type OptionItem = ProductOptionGroupWithOptions["options"][number];

export default function OpcionesPage() {
    const [groups, setGroups] = useState<ProductOptionGroupWithOptions[]>([]);
    const [candidates, setCandidates] = useState<OptionProductCandidate[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ProductOptionGroupWithOptions | null>(null);
    const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
    const [groupForm, setGroupForm] = useState({
        key: "",
        nombre: "",
        priceMode: "ADD" as ProductOptionPriceMode,
        required: false,
        orden: 1,
    });
    const [isOptionSheetOpen, setIsOptionSheetOpen] = useState(false);
    const [editingOption, setEditingOption] = useState<OptionItem | null>(null);
    const [isSubmittingOption, setIsSubmittingOption] = useState(false);
    const [optionForm, setOptionForm] = useState({
        label: "",
        slug: "",
        optionProductId: "",
        recipeMultiplier: "",
        activo: true,
        orden: 1,
    });

    const selectedGroup = useMemo(
        () => groups.find((group) => group.id === selectedGroupId) ?? null,
        [groups, selectedGroupId]
    );

    const candidateMap = useMemo(() => {
        return candidates.reduce<Record<string, string>>((acc, candidate) => {
            acc[candidate.id] = candidate.nombre;
            return acc;
        }, {});
    }, [candidates]);

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [groupsRes, candidatesRes] = await Promise.all([
                getProductOptionGroups(),
                getOptionProductCandidates(),
            ]);

            if (groupsRes.success && groupsRes.data) {
                const groupsData = groupsRes.data as ProductOptionGroupWithOptions[];
                setGroups(groupsData);
                setSelectedGroupId((current) => {
                    if (!current) {
                        return groupsData.length > 0 ? groupsData[0].id : null;
                    }
                    return groupsData.some((group) => group.id === current) ? current : null;
                });
            } else {
                toast.error(groupsRes.error || "Error al cargar grupos");
            }

            if (candidatesRes.success && candidatesRes.data) {
                setCandidates(candidatesRes.data as OptionProductCandidate[]);
            } else if (candidatesRes.error) {
                toast.error(candidatesRes.error || "Error al cargar productos vinculables");
            }
        } catch (error) {
            console.error("Error loading option catalog:", error);
            toast.error("Error de conexion");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshData();
    }, [refreshData]);

    useEffect(() => {
        if (!isGroupSheetOpen) {
            setEditingGroup(null);
            setGroupForm({
                key: "",
                nombre: "",
                priceMode: "ADD",
                required: false,
                orden: 1,
            });
        }
    }, [isGroupSheetOpen]);

    useEffect(() => {
        if (!isOptionSheetOpen) {
            setEditingOption(null);
            setOptionForm({
                label: "",
                slug: "",
                optionProductId: "",
                recipeMultiplier: "",
                activo: true,
                orden: 1,
            });
        }
    }, [isOptionSheetOpen]);

    const slugifyLabel = (value: string) => {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const openCreateGroup = () => {
        setEditingGroup(null);
        setGroupForm({
            key: "",
            nombre: "",
            priceMode: "ADD",
            required: false,
            orden: Math.max(1, groups.length + 1),
        });
        setIsGroupSheetOpen(true);
    };

    const openEditGroup = (group: ProductOptionGroupWithOptions) => {
        setEditingGroup(group);
        setGroupForm({
            key: group.key,
            nombre: group.nombre,
            priceMode: group.priceMode,
            required: group.required,
            orden: group.orden,
        });
        setIsGroupSheetOpen(true);
    };

    const openCreateOption = () => {
        if (!selectedGroup) {
            toast.error("Selecciona un grupo primero");
            return;
        }
        setEditingOption(null);
        setOptionForm({
            label: "",
            slug: "",
            optionProductId: "",
            recipeMultiplier: "",
            activo: true,
            orden: Math.max(1, selectedGroup.options.length + 1),
        });
        setIsOptionSheetOpen(true);
    };

    const openEditOption = (option: OptionItem) => {
        setEditingOption(option);
        setOptionForm({
            label: option.label,
            slug: option.slug,
            optionProductId: option.optionProductId ?? "",
            recipeMultiplier: option.recipeMultiplier ? String(option.recipeMultiplier) : "",
            activo: option.activo,
            orden: option.orden,
        });
        setIsOptionSheetOpen(true);
    };

    const handleDeleteGroup = async (group: ProductOptionGroupWithOptions) => {
        const confirmed = window.confirm(`Eliminar el grupo '${group.nombre}'?`);
        if (!confirmed) {
            return;
        }

        setIsSubmittingGroup(true);
        try {
            const res = await deleteProductOptionGroup(group.id);
            if (res.success) {
                toast.success("Grupo eliminado");
                await refreshData();
            } else {
                toast.error(res.error || "Error al eliminar el grupo");
            }
        } catch (error) {
            console.error("Error deleting group:", error);
            toast.error("Error de conexion");
        } finally {
            setIsSubmittingGroup(false);
        }
    };

    const handleDeleteOption = async (option: OptionItem) => {
        const confirmed = window.confirm(`Eliminar la opcion '${option.label}'?`);
        if (!confirmed) {
            return;
        }

        setIsSubmittingOption(true);
        try {
            const res = await softDeleteProductOption(option.id);
            if (res.success) {
                toast.success("Opcion eliminada");
                await refreshData();
            } else {
                toast.error(res.error || "Error al eliminar la opcion");
            }
        } catch (error) {
            console.error("Error deleting option:", error);
            toast.error("Error de conexion");
        } finally {
            setIsSubmittingOption(false);
        }
    };

    const handleSubmitGroup = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!groupForm.nombre.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }

        if (!editingGroup && !groupForm.key.trim()) {
            toast.error("El key es obligatorio");
            return;
        }

        setIsSubmittingGroup(true);
        try {
            const payload = {
                key: groupForm.key.trim(),
                nombre: groupForm.nombre.trim(),
                priceMode: groupForm.priceMode,
                required: groupForm.required,
                orden: Number(groupForm.orden) || 1,
            };

            const res = editingGroup
                ? await updateProductOptionGroup(editingGroup.id, {
                    nombre: payload.nombre,
                    priceMode: payload.priceMode,
                    required: payload.required,
                    orden: payload.orden,
                })
                : await createProductOptionGroup(payload);

            if (res.success) {
                toast.success(editingGroup ? "Grupo actualizado" : "Grupo creado");
                setIsGroupSheetOpen(false);
                await refreshData();
            } else {
                toast.error(res.error || "Error al guardar el grupo");
            }
        } catch (error) {
            console.error("Error saving group:", error);
            toast.error("Error de conexion");
        } finally {
            setIsSubmittingGroup(false);
        }
    };

    const handleSubmitOption = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedGroup) {
            toast.error("Selecciona un grupo primero");
            return;
        }

        if (!optionForm.label.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }

        if (!editingOption && !optionForm.slug.trim()) {
            toast.error("El slug es obligatorio");
            return;
        }

        setIsSubmittingOption(true);
        try {
            const hasLinkedProduct = optionForm.optionProductId.trim() !== "";
            const recipeMultiplierValue = hasLinkedProduct
                ? null
                : optionForm.recipeMultiplier.trim() === ""
                    ? null
                    : Number(optionForm.recipeMultiplier);

            const payload = {
                label: optionForm.label.trim(),
                slug: optionForm.slug.trim(),
                optionProductId: hasLinkedProduct ? optionForm.optionProductId : null,
                recipeMultiplier: recipeMultiplierValue,
                activo: optionForm.activo,
                orden: Number(optionForm.orden) || 1,
            };

            const res = editingOption
                ? await updateProductOption(editingOption.id, {
                    label: payload.label,
                    optionProductId: payload.optionProductId,
                    recipeMultiplier: payload.recipeMultiplier,
                    activo: payload.activo,
                    orden: payload.orden,
                })
                : await createProductOption(selectedGroup.id, payload);

            if (res.success) {
                toast.success(editingOption ? "Opcion actualizada" : "Opcion creada");
                setIsOptionSheetOpen(false);
                await refreshData();
            } else {
                toast.error(res.error || "Error al guardar la opcion");
            }
        } catch (error) {
            console.error("Error saving option:", error);
            toast.error("Error de conexion");
        } finally {
            setIsSubmittingOption(false);
        }
    };

    return (
        <div className="app-page-safe-bottom space-y-6 px-4 pb-8 md:px-0">
            <section className="space-y-4">
                <Link
                    href="/admin/dashboard/productos"
                    className="inline-flex max-w-fit items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a productos
                </Link>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                                <Layers className="h-5 w-5" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                                Catalogo de opciones
                            </h1>
                        </div>
                        <p className="text-sm font-medium text-zinc-500 md:text-base">
                            Administra grupos y opciones reutilizables para productos configurables.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 w-full rounded-2xl border-zinc-200 sm:w-auto"
                            onClick={openCreateGroup}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo grupo
                        </Button>
                        <Button
                            type="button"
                            className="h-11 w-full rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 sm:w-auto"
                            disabled={!selectedGroup}
                            onClick={openCreateOption}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva opcion
                        </Button>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Grupos</p>
                            <p className="text-sm font-semibold text-zinc-600">
                                {groups.length} grupos cargados
                            </p>
                        </div>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> : null}
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-10 text-sm text-zinc-400">
                            Cargando grupos...
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
                                <Layers className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-800">No hay grupos de opciones creados</p>
                                <p className="text-sm text-zinc-500">
                                    Crea el primer grupo para organizar las opciones de tus productos.
                                </p>
                                <Button
                                    type="button"
                                    className="mt-2 h-10 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800"
                                    onClick={openCreateGroup}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear grupo
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {groups.map((group) => {
                                const isSelected = group.id === selectedGroupId;
                                return (
                                    <div
                                        key={group.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedGroupId(group.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                setSelectedGroupId(group.id);
                                            }
                                        }}
                                        className={`w-full cursor-pointer rounded-[1.5rem] border p-4 text-left transition ${
                                            isSelected ? "border-sky-200 bg-sky-50" : "border-zinc-100 hover:border-zinc-200"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-base font-bold text-zinc-900">{group.nombre}</p>
                                                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                                                    {group.key}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge variant="secondary" className="bg-zinc-100 text-zinc-700">
                                                    {group._count?.assignments ?? 0} asignados
                                                </Badge>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="h-8 w-8 rounded-full p-0 text-zinc-500 hover:bg-white"
                                                            onClick={(event) => event.stopPropagation()}
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44 rounded-2xl border-zinc-100 p-2">
                                                        <DropdownMenuItem
                                                            className="cursor-pointer rounded-xl"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openEditGroup(group);
                                                            }}
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4 text-zinc-500" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer rounded-xl text-rose-600 focus:text-rose-700"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                void handleDeleteGroup(group);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="border-sky-200 text-sky-700">
                                                {group.priceMode}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={group.required ? "border-rose-200 text-rose-600" : "border-emerald-200 text-emerald-600"}
                                            >
                                                {group.required ? "Requerido" : "Opcional"}
                                            </Badge>
                                            <Badge variant="outline" className="border-zinc-200 text-zinc-600">
                                                {group.options?.length ?? 0} opciones
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Opciones</p>
                            <p className="text-sm font-semibold text-zinc-600">
                                {selectedGroup ? `Grupo: ${selectedGroup.nombre}` : "Selecciona un grupo"}
                            </p>
                        </div>
                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-700">
                            {selectedGroup?.options?.length ?? 0} opciones
                        </Badge>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-10 text-sm text-zinc-400">
                            Cargando opciones...
                        </div>
                    ) : !selectedGroup ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
                                <Settings2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-800">Selecciona un grupo para ver sus opciones</p>
                                <p className="text-sm text-zinc-500">
                                    Usa el panel de la izquierda para ver las opciones disponibles.
                                </p>
                            </div>
                        </div>
                    ) : selectedGroup.options.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
                                <Settings2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-800">Este grupo no tiene opciones</p>
                                <p className="text-sm text-zinc-500">Agrega opciones para que los clientes puedan elegir.</p>
                                <Button
                                    type="button"
                                    className="mt-2 h-10 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800"
                                    onClick={openCreateOption}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear opcion
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedGroup.options.map((option) => (
                                <div
                                    key={option.id}
                                    className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50 px-4 py-3"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-zinc-900">{option.label}</p>
                                            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                                                {option.slug}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                            <Badge
                                                variant="secondary"
                                                className={option.activo ? "bg-emerald-100 text-emerald-600" : "bg-zinc-200 text-zinc-600"}
                                            >
                                                {option.activo ? "Activa" : "Inactiva"}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-full p-0 text-zinc-500 hover:bg-white"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44 rounded-2xl border-zinc-100 p-2">
                                                    <DropdownMenuItem
                                                        className="cursor-pointer rounded-xl"
                                                        onClick={() => openEditOption(option)}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4 text-zinc-500" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer rounded-xl text-rose-600 focus:text-rose-700"
                                                        onClick={() => void handleDeleteOption(option)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    {option.optionProductId ? (
                                        <p className="mt-2 text-xs font-medium text-sky-700">
                                            Vinculada a {candidateMap[option.optionProductId] || "producto"}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <ResponsivePanel
                open={isOptionSheetOpen}
                onOpenChange={setIsOptionSheetOpen}
                title={editingOption ? "Editar opcion" : "Nueva opcion"}
                description={
                    editingOption
                        ? "Actualiza los datos de la opcion seleccionada."
                        : "Crea una opcion dentro del grupo seleccionado."
                }
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-md"
            >
                <form onSubmit={handleSubmitOption} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="option-label" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Nombre visible
                        </Label>
                        <Input
                            id="option-label"
                            placeholder="Napolitana"
                            value={optionForm.label}
                            onChange={(event) => {
                                const label = event.target.value;
                                setOptionForm((current) => ({
                                    ...current,
                                    label,
                                    slug: editingOption ? current.slug : slugifyLabel(label),
                                }));
                            }}
                            className="h-11 rounded-2xl border-zinc-200 bg-white text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="option-slug" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Slug
                        </Label>
                        <Input
                            id="option-slug"
                            placeholder="napolitana"
                            value={optionForm.slug}
                            onChange={(event) => setOptionForm((current) => ({ ...current, slug: event.target.value }))}
                            className="h-11 rounded-2xl border-zinc-200 bg-zinc-50 text-sm font-mono"
                            disabled={Boolean(editingOption)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Producto vinculado</Label>
                        <Select
                            value={optionForm.optionProductId || "none"}
                            onValueChange={(value) =>
                                setOptionForm((current) => ({
                                    ...current,
                                    optionProductId: value === "none" ? "" : value,
                                }))
                            }
                        >
                            <SelectTrigger className="h-11 rounded-2xl border-zinc-200 bg-white">
                                <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-zinc-100">
                                <SelectItem value="none" className="rounded-xl">
                                    Sin producto vinculado
                                </SelectItem>
                                {candidates.map((candidate) => (
                                    <SelectItem key={candidate.id} value={candidate.id} className="rounded-xl">
                                        {candidate.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="option-multiplier" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Cantidad (multiplicador)
                        </Label>
                        <Input
                            id="option-multiplier"
                            type="number"
                            min={0}
                            step="0.1"
                            placeholder="1"
                            value={optionForm.recipeMultiplier}
                            onChange={(event) =>
                                setOptionForm((current) => ({ ...current, recipeMultiplier: event.target.value }))
                            }
                            className="h-11 rounded-2xl border-zinc-200 bg-white text-sm"
                            disabled={optionForm.optionProductId.trim() !== ""}
                        />
                        {optionForm.optionProductId.trim() !== "" ? (
                            <p className="text-xs text-sky-600">El stock viene del producto vinculado.</p>
                        ) : (
                            <p className="text-xs text-zinc-500">Ej: 6 para media docena.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="option-orden" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Orden
                        </Label>
                        <Input
                            id="option-orden"
                            type="number"
                            min={1}
                            value={optionForm.orden}
                            onChange={(event) =>
                                setOptionForm((current) => ({
                                    ...current,
                                    orden: Number(event.target.value),
                                }))
                            }
                            className="h-11 rounded-2xl border-zinc-200 bg-white text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-4">
                        <div className="space-y-1">
                            <Label className="text-sm font-bold text-zinc-900">Opcion activa</Label>
                            <p className="text-xs text-zinc-500">Disponible para asignar en productos.</p>
                        </div>
                        <Switch
                            checked={optionForm.activo}
                            onCheckedChange={(checked) => setOptionForm((current) => ({ ...current, activo: checked }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl border-zinc-200"
                            onClick={() => setIsOptionSheetOpen(false)}
                            disabled={isSubmittingOption}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="h-11 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800"
                            disabled={isSubmittingOption}
                        >
                            {isSubmittingOption ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Guardar
                        </Button>
                    </div>
                </form>
            </ResponsivePanel>

            <ResponsivePanel
                open={isGroupSheetOpen}
                onOpenChange={setIsGroupSheetOpen}
                title={editingGroup ? "Editar grupo" : "Nuevo grupo"}
                description={
                    editingGroup
                        ? "Actualiza los datos del grupo seleccionado."
                        : "Crea un grupo reutilizable para opciones configurables."
                }
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-md"
            >
                <form onSubmit={handleSubmitGroup} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="group-key" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Key (identificador)
                        </Label>
                        <Input
                            id="group-key"
                            placeholder="salsa"
                            value={groupForm.key}
                            onChange={(event) => setGroupForm((current) => ({ ...current, key: event.target.value }))}
                            className="h-11 rounded-2xl border-zinc-200 bg-white text-sm font-mono"
                            disabled={Boolean(editingGroup)}
                        />
                        <p className="text-xs text-zinc-500">
                            Solo letras, numeros o "_" en lowercase. No se puede cambiar luego.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="group-nombre" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Nombre visible
                        </Label>
                        <Input
                            id="group-nombre"
                            placeholder="Salsas"
                            value={groupForm.nombre}
                            onChange={(event) => setGroupForm((current) => ({ ...current, nombre: event.target.value }))}
                            className="h-11 rounded-2xl border-zinc-200 bg-white text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Modo de precio</Label>
                        <Select
                            value={groupForm.priceMode}
                            onValueChange={(value) =>
                                setGroupForm((current) => ({ ...current, priceMode: value as ProductOptionPriceMode }))
                            }
                        >
                            <SelectTrigger className="h-11 rounded-2xl border-zinc-200 bg-white">
                                <SelectValue placeholder="Selecciona un modo" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-zinc-100">
                                <SelectItem value="ADD" className="rounded-xl">
                                    Suma al precio base
                                </SelectItem>
                                <SelectItem value="OVERRIDE" className="rounded-xl">
                                    Reemplaza el precio base
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="group-orden" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Orden
                        </Label>
                        <Input
                            id="group-orden"
                            type="number"
                            min={1}
                            value={groupForm.orden}
                            onChange={(event) =>
                                setGroupForm((current) => ({
                                    ...current,
                                    orden: Number(event.target.value),
                                }))
                            }
                            className="h-11 rounded-2xl border-zinc-200 bg-white text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-4">
                        <div className="space-y-1">
                            <Label className="text-sm font-bold text-zinc-900">Grupo obligatorio</Label>
                            <p className="text-xs text-zinc-500">El cliente debe elegir una opcion.</p>
                        </div>
                        <Switch
                            checked={groupForm.required}
                            onCheckedChange={(checked) =>
                                setGroupForm((current) => ({ ...current, required: checked }))
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl border-zinc-200"
                            onClick={() => setIsGroupSheetOpen(false)}
                            disabled={isSubmittingGroup}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="h-11 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800"
                            disabled={isSubmittingGroup}
                        >
                            {isSubmittingGroup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Guardar
                        </Button>
                    </div>
                </form>
            </ResponsivePanel>

            {candidates.length === 0 && !isLoading ? (
                <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                    No hay productos OPTION_PRODUCT disponibles para vincular. Crea uno desde el alta de productos.
                </div>
            ) : null}
        </div>
    );
}
