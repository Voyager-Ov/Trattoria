"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Loader2,
    Lock,
    Mail,
    Save,
    Shield,
    User,
    UserCheck,
    UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { createEmployee } from "./userActions";

const formSchema = z.object({
    displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electronico invalido"),
    password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
    rol: z.enum(["ADMIN", "EMPLEADO"]),
    estado: z.enum(["ACTIVO", "INACTIVO"]),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateEmployeeSheetProps {
    onSuccess: () => void;
}

export function CreateEmployeeSheet({ onSuccess }: CreateEmployeeSheetProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            displayName: "",
            email: "",
            password: "",
            rol: "EMPLEADO",
            estado: "ACTIVO",
        },
    });

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        try {
            const result = await createEmployee(values);
            if (result.success) {
                toast.success("Empleado creado correctamente");
                form.reset();
                setOpen(false);
                onSuccess();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Ocurrio un error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <Button
                type="button"
                onClick={() => setOpen(true)}
                className="h-11 w-full rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 sm:w-auto sm:rounded-full sm:px-6"
            >
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo empleado
            </Button>

            <ResponsivePanel
                open={open}
                onOpenChange={setOpen}
                title="Nuevo empleado"
                description="Crea un nuevo perfil de acceso para tu equipo."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-xl"
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <section className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                                Informacion personal
                            </Label>

                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="flex items-center gap-2 font-bold text-zinc-700">
                                            <User className="h-4 w-4 text-zinc-400" />
                                            Nombre completo
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej: Juan Perez"
                                                {...field}
                                                className="h-12 rounded-2xl border-zinc-200 bg-white text-base font-medium shadow-sm focus-visible:ring-zinc-400"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-medium" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="flex items-center gap-2 font-bold text-zinc-700">
                                            <Mail className="h-4 w-4 text-zinc-400" />
                                            Correo electronico
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="juan@empresa.com"
                                                {...field}
                                                className="h-12 rounded-2xl border-zinc-200 bg-white text-base font-medium shadow-sm focus-visible:ring-zinc-400"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-medium" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="flex items-center gap-2 font-bold text-zinc-700">
                                            <Lock className="h-4 w-4 text-zinc-400" />
                                            Contrasena
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Minimo 6 caracteres"
                                                {...field}
                                                className="h-12 rounded-2xl border-zinc-200 bg-white text-base font-medium shadow-sm focus-visible:ring-zinc-400"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-medium" />
                                    </FormItem>
                                )}
                            />
                        </section>

                        <section className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                                Permisos y estado
                            </Label>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="rol"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="flex items-center gap-2 font-bold text-zinc-700">
                                                <Shield className="h-4 w-4 text-zinc-400" />
                                                Rol
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white text-base font-medium shadow-sm focus:ring-zinc-400">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-2xl border-zinc-100 p-2 shadow-2xl">
                                                    <SelectItem value="EMPLEADO" className="rounded-xl py-2.5">
                                                        Empleado
                                                    </SelectItem>
                                                    <SelectItem value="ADMIN" className="rounded-xl py-2.5">
                                                        Administrador
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-xs font-medium" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="estado"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="flex items-center gap-2 font-bold text-zinc-700">
                                                <UserCheck className="h-4 w-4 text-zinc-400" />
                                                Estado
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white text-base font-medium shadow-sm focus:ring-zinc-400">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-2xl border-zinc-100 p-2 shadow-2xl">
                                                    <SelectItem value="ACTIVO" className="rounded-xl py-2.5">
                                                        Activo
                                                    </SelectItem>
                                                    <SelectItem value="INACTIVO" className="rounded-xl py-2.5">
                                                        Inactivo
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-xs font-medium" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        <div className="-mx-4 sticky bottom-0 mt-6 border-t border-zinc-100 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 backdrop-blur sm:-mx-6 sm:px-6">
                            <div className="grid grid-cols-2 gap-3">
                                <Button type="button" variant="outline" className="h-11 rounded-2xl border-zinc-200" onClick={() => setOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Crear
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </ResponsivePanel>
        </>
    );
}
