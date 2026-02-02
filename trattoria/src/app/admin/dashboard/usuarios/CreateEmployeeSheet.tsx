"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Save, User, Mail, Lock, Shield, UserCheck } from "lucide-react";
import { createEmployee } from "./userActions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
    displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
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
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200 transition-all font-semibold h-12 px-8">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Nuevo Empleado
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl rounded-l-[3rem] border-zinc-100 overflow-y-auto p-10">
                <SheetHeader className="mb-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-14 w-14 bg-zinc-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-zinc-200">
                            <UserPlus size={28} />
                        </div>
                    </div>
                    <SheetTitle className="text-4xl font-bold text-zinc-900 tracking-tight">
                        Nuevo Empleado
                    </SheetTitle>
                    <SheetDescription className="text-zinc-500 text-lg">
                        Crea un nuevo perfil de acceso para tu equipo de trabajo.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 pb-8">
                        {/* Section: Información Personal */}
                        <div className="space-y-6">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Información Personal</Label>

                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-zinc-700 font-bold flex items-center gap-2">
                                            <User size={14} className="text-zinc-400" />
                                            Nombre Completo
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej: Juan Pérez"
                                                {...field}
                                                className="h-12 rounded-xl border-zinc-200 bg-white focus-visible:ring-zinc-400 text-base font-medium shadow-sm"
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
                                        <FormLabel className="text-zinc-700 font-bold flex items-center gap-2">
                                            <Mail size={14} className="text-zinc-400" />
                                            Correo Electrónico
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="juan@ejemplo.com"
                                                {...field}
                                                className="h-12 rounded-xl border-zinc-200 bg-white focus-visible:ring-zinc-400 text-base font-medium shadow-sm"
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
                                        <FormLabel className="text-zinc-700 font-bold flex items-center gap-2">
                                            <Lock size={14} className="text-zinc-400" />
                                            Contraseña de Acceso
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...field}
                                                className="h-12 rounded-xl border-zinc-200 bg-white focus-visible:ring-zinc-400 text-base font-medium shadow-sm"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-medium" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Section: Configuración de Cuenta */}
                        <div className="space-y-6">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Permisos y Estado</Label>

                            <div className="grid grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="rol"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-zinc-700 font-bold flex items-center gap-2">
                                                <Shield size={14} className="text-zinc-400" />
                                                Rol
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 bg-white focus-visible:ring-zinc-400 text-base font-medium shadow-sm">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl p-2">
                                                    <SelectItem value="EMPLEADO" className="rounded-xl py-2.5">Empleado</SelectItem>
                                                    <SelectItem value="ADMIN" className="rounded-xl py-2.5">Administrador</SelectItem>
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
                                            <FormLabel className="text-zinc-700 font-bold flex items-center gap-2">
                                                <UserCheck size={14} className="text-zinc-400" />
                                                Estado
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 bg-white focus-visible:ring-zinc-400 text-base font-medium shadow-sm">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl p-2">
                                                    <SelectItem value="ACTIVO" className="rounded-xl py-2.5 text-emerald-600 font-medium">Activo</SelectItem>
                                                    <SelectItem value="INACTIVO" className="rounded-xl py-2.5 text-rose-600 font-medium">Inactivo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-xs font-medium" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button
                                type="submit"
                                className="w-full h-14 rounded-[1.5rem] bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl shadow-zinc-200 transition-all font-bold text-lg gap-3"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        Creando cuenta...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        Crear Empleado
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
