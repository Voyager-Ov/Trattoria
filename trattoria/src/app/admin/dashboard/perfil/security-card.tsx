'use client';

import { useState, useEffect } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, User, linkWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SecurityCard() {
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Visibility Toggles
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

    // Check if user has "password" provider linked
    const hasPasswordProvider = user?.providerData.some(p => p.providerId === 'password');

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (newPassword !== confirmPassword) {
            toast.error('Las nuevas contraseñas no coinciden');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);
        try {
            // LINK credential to existing user (Google -> Google + Password)
            const credential = EmailAuthProvider.credential(user.email!, newPassword);
            await linkWithCredential(user, credential);
            toast.success('Contraseña configurada exitosamente. Ahora puedes ingresar con email y contraseña.');

            // Cleanup
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error setting password:', error);
            if (error.code === 'auth/credential-already-in-use') {
                toast.error('Este email ya está asociado a otra cuenta con contraseña.');
            } else if (error.code === 'auth/requires-recent-login') {
                toast.error('Por seguridad, cierra sesión y vuelve a ingresar para configurar tu contraseña.');
            } else if (error.code === 'auth/weak-password') {
                toast.error('La contraseña es muy débil. Intenta combinar letras, números y símbolos.');
            } else {
                toast.error('Ocurrió un error: ' + error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('No hay sesión activa');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Las nuevas contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);
        try {
            // Re-auth required before sensitive operation
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, newPassword);
            toast.success('Tu contraseña ha sido actualizada.');

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error changing password:', error);
            if (error.code === 'auth/wrong-password') {
                toast.error('La contraseña actual es incorrecta.');
            } else if (error.code === 'auth/requires-recent-login') {
                toast.error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
            } else {
                toast.error('Error al actualizar: ' + error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-6">
            {/* Header / Status Badge */}
            <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-700">Método de acceso</span>
                    <span className="text-xs text-zinc-500">
                        {hasPasswordProvider
                            ? "Tienes contraseña configurada"
                            : "Solo acceso con Google (sin contraseña)"}
                    </span>
                </div>
                <div className={cn("px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold border",
                    hasPasswordProvider
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-orange-50 text-orange-700 border-orange-200"
                )}>
                    {hasPasswordProvider ? <Check className="w-3 h-3" /> : null}
                    {hasPasswordProvider ? "Contraseña Activa" : "Requiere Configuración"}
                </div>
            </div>

            {!hasPasswordProvider ? (
                /* === MODE: SET PASSWORD (LINKING) === */
                <form onSubmit={handleSetPassword} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 mb-4">
                        <p><strong>Configurar Contraseña:</strong> Todavía no tenés contraseña porque ingresaste con Google. Configurala para poder iniciar sesión también con email y contraseña.</p>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPasswordSet" className="font-semibold text-zinc-700">Nueva Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="newPasswordSet"
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Mínimo 6 caracteres"
                                    className="rounded-xl h-11 border-zinc-200 focus:ring-orange-500 focus:border-orange-500 pr-10"
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600">
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPasswordSet" className="font-semibold text-zinc-700">Confirmar Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPasswordSet"
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Repite la contraseña"
                                    className="rounded-xl h-11 border-zinc-200 focus:ring-orange-500 focus:border-orange-500 pr-10"
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600">
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 font-bold shadow-md shadow-orange-100 transition-all mt-2">
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Configurar Contraseña"}
                    </Button>
                </form>
            ) : (
                /* === MODE: CHANGE PASSWORD (UPDATE) === */
                <form onSubmit={handleChangePassword} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm text-zinc-500 mb-2">
                        Actualizá tu contraseña periódicamente para mantener tu cuenta segura.
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="font-semibold text-zinc-700">Contraseña Actual</Label>
                        <div className="relative">
                            <Input
                                id="currentPassword"
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="rounded-xl h-11 border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900 pr-10"
                            />
                            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600">
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="font-semibold text-zinc-700">Nueva Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Mínimo 6 caracteres"
                                    className="rounded-xl h-11 border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900 pr-10"
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600">
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="font-semibold text-zinc-700">Confirmar Nueva</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Repite la nueva contraseña"
                                    className="rounded-xl h-11 border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900 pr-10"
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600">
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 font-bold shadow-md shadow-zinc-200 transition-all mt-4">
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...</> : "Actualizar Contraseña"}
                    </Button>
                </form>
            )}
        </div>
    );
}
