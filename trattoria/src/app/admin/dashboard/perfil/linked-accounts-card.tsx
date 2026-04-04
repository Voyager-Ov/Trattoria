'use client';

import { auth, googleProvider } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GoogleAuthProvider, linkWithPopup, type User, unlink } from 'firebase/auth';
import { Link as LinkIcon, Loader2, Unlink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return 'Error desconocido';
}

function getFirebaseErrorCode(error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
        return error.code;
    }

    return '';
}

export function LinkedAccountsCard() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    const isGoogleLinked = user?.providerData.some(
        (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
    );

    const handleLinkGoogle = async () => {
        if (!user) {
            return;
        }

        setIsLoading(true);
        try {
            await linkWithPopup(user, googleProvider);
            toast.success('Cuenta de Google vinculada correctamente');
        } catch (error: unknown) {
            console.error('Error linking Google:', error);
            if (getFirebaseErrorCode(error) === 'auth/credential-already-in-use') {
                toast.error('Esta cuenta ya esta en uso');
            } else {
                toast.error(`Error: ${getErrorMessage(error)}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnlinkGoogle = async () => {
        if (!user) {
            return;
        }

        setIsLoading(true);
        try {
            await unlink(user, GoogleAuthProvider.PROVIDER_ID);
            toast.success('Cuenta de Google desvinculada');
        } catch (error: unknown) {
            console.error('Error unlinking Google:', error);
            toast.error(`Error: ${getErrorMessage(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-black text-zinc-900">Google</p>
                            <span
                                className={cn(
                                    'inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em]',
                                    isGoogleLinked ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-200/70 text-zinc-600'
                                )}
                            >
                                {isGoogleLinked ? 'Conectado' : 'No conectado'}
                            </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                            {isGoogleLinked
                                ? 'Tu cuenta de Google esta lista para iniciar sesion.'
                                : 'Puedes vincular Google para agilizar el acceso al panel.'}
                        </p>
                    </div>
                </div>

                <div className="w-full sm:w-auto">
                    {isGoogleLinked ? (
                        <Button
                            variant="outline"
                            onClick={handleUnlinkGoogle}
                            disabled={isLoading}
                            className="h-11 w-full rounded-2xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 sm:w-auto"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Unlink className="mr-2 h-4 w-4" />
                                    Desvincular
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={handleLinkGoogle}
                            disabled={isLoading}
                            className="h-11 w-full rounded-2xl border-zinc-200 text-zinc-700 hover:bg-zinc-100 sm:w-auto"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    Conectar
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
