'use client';

import { useState, useEffect } from 'react';
import { linkWithPopup, unlink, GoogleAuthProvider, User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, Link as LinkIcon, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
        if (!user) return;
        setIsLoading(true);
        try {
            await linkWithPopup(user, googleProvider);
            toast.success('Cuenta de Google vinculada correctamente');
        } catch (error: any) {
            console.error('Error linking Google:', error);
            if (error.code === 'auth/credential-already-in-use') {
                toast.error('Esta cuenta ya está en uso');
            } else {
                toast.error('Error: ' + error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnlinkGoogle = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            await unlink(user, GoogleAuthProvider.PROVIDER_ID);
            toast.success('Cuenta de Google desvinculada');
        } catch (error: any) {
            console.error('Error unlinking Google:', error);
            toast.error('Error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="flex items-center justify-between p-4 border border-zinc-100 rounded-2xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
            <div className="flex items-center space-x-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-white border border-zinc-100 shadow-sm">
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
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
                <div>
                    <p className="text-base font-bold text-zinc-900">Google</p>
                    <p className={cn("text-xs font-medium", isGoogleLinked ? "text-emerald-500" : "text-zinc-400")}>
                        {isGoogleLinked ? 'Conectado correctamente' : 'No conectado'}
                    </p>
                </div>
            </div>
            {isGoogleLinked ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnlinkGoogle}
                    disabled={isLoading}
                    className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4 mr-2" />}
                    Desvincular
                </Button>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLinkGoogle}
                    disabled={isLoading}
                    className="rounded-xl border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Conectar'}
                </Button>
            )}
        </div>
    );
}
