"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    EmailAuthProvider,
    linkWithCredential,
    reauthenticateWithCredential,
    updatePassword,
    type User,
} from "firebase/auth";
import { Check, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return "Error desconocido";
}

function getFirebaseErrorCode(error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
        return error.code;
    }

    return "";
}

type PasswordFieldProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    visible: boolean;
    onToggleVisibility: () => void;
};

function PasswordField({
    id,
    label,
    value,
    onChange,
    placeholder,
    visible,
    onToggleVisibility,
}: PasswordFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-semibold text-zinc-700">
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    minLength={6}
                    required
                    placeholder={placeholder}
                    className="h-12 rounded-2xl border-zinc-200 pr-12 text-sm focus-visible:ring-zinc-900"
                />
                <button
                    type="button"
                    onClick={onToggleVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-600"
                    aria-label={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}

export function SecurityCard() {
    const [isLoading, setIsLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    const hasPasswordProvider = user?.providerData.some((provider) => provider.providerId === "password");

    const resetForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    const validatePasswords = () => {
        if (newPassword !== confirmPassword) {
            toast.error("Las contrasenas nuevas no coinciden");
            return false;
        }

        if (newPassword.length < 6) {
            toast.error("La contrasena debe tener al menos 6 caracteres");
            return false;
        }

        return true;
    };

    const handleSetPassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!user || !validatePasswords()) {
            return;
        }

        setIsLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email!, newPassword);
            await linkWithCredential(user, credential);
            toast.success("Contrasena configurada. Ya puedes entrar con email y contrasena.");
            resetForm();
        } catch (error: unknown) {
            console.error("Error setting password:", error);
            const errorCode = getFirebaseErrorCode(error);
            if (errorCode === "auth/credential-already-in-use") {
                toast.error("Este email ya esta asociado a otra cuenta con contrasena.");
            } else if (errorCode === "auth/requires-recent-login") {
                toast.error("Cierra sesion y vuelve a entrar para configurar tu contrasena.");
            } else if (errorCode === "auth/weak-password") {
                toast.error("La contrasena es muy debil. Combina letras, numeros y simbolos.");
            } else {
                toast.error(`Ocurrio un error: ${getErrorMessage(error)}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!user) {
            toast.error("No hay una sesion activa");
            return;
        }

        if (!validatePasswords()) {
            return;
        }

        setIsLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            toast.success("Tu contrasena fue actualizada.");
            resetForm();
        } catch (error: unknown) {
            console.error("Error changing password:", error);
            const errorCode = getFirebaseErrorCode(error);
            if (errorCode === "auth/wrong-password") {
                toast.error("La contrasena actual es incorrecta.");
            } else if (errorCode === "auth/requires-recent-login") {
                toast.error("La sesion expiro. Vuelve a iniciar sesion.");
            } else {
                toast.error(`Error al actualizar: ${getErrorMessage(error)}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-zinc-700">Metodo de acceso</div>
                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                            {hasPasswordProvider
                                ? "Tu cuenta ya tiene contrasena activa ademas del acceso con Google."
                                : "Hoy entras solo con Google. Configura una contrasena para sumar acceso por email."}
                        </p>
                    </div>
                    <div
                        className={cn(
                            "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em]",
                            hasPasswordProvider
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-orange-200 bg-orange-50 text-orange-700"
                        )}
                    >
                        {hasPasswordProvider ? <Check className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                        {hasPasswordProvider ? "Activa" : "Pendiente"}
                    </div>
                </div>
            </div>

            {!hasPasswordProvider ? (
                <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
                    <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-900">
                        Configura una contrasena para iniciar sesion tambien con email y contrasena cuando lo necesites.
                    </div>

                    <PasswordField
                        id="newPasswordSet"
                        label="Nueva contrasena"
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="Minimo 6 caracteres"
                        visible={showNew}
                        onToggleVisibility={() => setShowNew((value) => !value)}
                    />

                    <PasswordField
                        id="confirmPasswordSet"
                        label="Confirmar contrasena"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Repite la contrasena"
                        visible={showConfirm}
                        onToggleVisibility={() => setShowConfirm((value) => !value)}
                    />

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="mt-1 h-12 w-full rounded-2xl bg-orange-500 font-bold text-white shadow-md shadow-orange-100 transition-all hover:bg-orange-600"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Configurar contrasena"
                        )}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                    <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm leading-6 text-zinc-600">
                        Actualiza tu contrasena con frecuencia para mantener la cuenta protegida.
                    </div>

                    <PasswordField
                        id="currentPassword"
                        label="Contrasena actual"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        placeholder="Ingresa tu contrasena actual"
                        visible={showCurrent}
                        onToggleVisibility={() => setShowCurrent((value) => !value)}
                    />

                    <PasswordField
                        id="newPassword"
                        label="Nueva contrasena"
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="Minimo 6 caracteres"
                        visible={showNew}
                        onToggleVisibility={() => setShowNew((value) => !value)}
                    />

                    <PasswordField
                        id="confirmPassword"
                        label="Confirmar nueva contrasena"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Repite la nueva contrasena"
                        visible={showConfirm}
                        onToggleVisibility={() => setShowConfirm((value) => !value)}
                    />

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="mt-1 h-12 w-full rounded-2xl bg-zinc-900 font-bold text-white shadow-md shadow-zinc-200 transition-all hover:bg-zinc-800"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Actualizando...
                            </>
                        ) : (
                            "Actualizar contrasena"
                        )}
                    </Button>
                </form>
            )}
        </div>
    );
}
