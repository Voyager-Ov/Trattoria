'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { updateProfile } from './actions';

type ProfileUser = {
    email: string | null;
    displayName: string | null;
    phone: string | null;
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            disabled={pending}
            type="submit"
            className="h-12 w-full rounded-2xl bg-zinc-900 font-bold text-white shadow-lg shadow-zinc-200 transition-all hover:bg-zinc-800"
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                </>
            )}
        </Button>
    );
}

export function ProfileForm({ user }: { user: ProfileUser }) {
    const [state, action] = useActionState(updateProfile, {});

    useEffect(() => {
        if (state.success) {
            toast.success(state.message);
        } else if (state.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <form action={action} className="flex flex-col gap-5">
            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-zinc-700">
                        Email
                    </Label>
                    <Input
                        id="email"
                        value={user.email ?? ''}
                        disabled
                        className="h-12 rounded-2xl border-zinc-200 bg-zinc-50 text-sm text-zinc-500 disabled:opacity-100"
                    />
                    <p className="text-xs leading-5 text-zinc-400">
                        El email no se puede cambiar desde esta pantalla.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-sm font-semibold text-zinc-700">
                        Nombre completo
                    </Label>
                    <Input
                        id="displayName"
                        name="displayName"
                        defaultValue={user.displayName || ''}
                        placeholder="Tu nombre"
                        className="h-12 rounded-2xl border-zinc-200 text-sm focus-visible:ring-zinc-900"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-zinc-700">
                        Telefono
                    </Label>
                    <Input
                        id="phone"
                        name="phone"
                        inputMode="tel"
                        defaultValue={user.phone || ''}
                        placeholder="+54 9 11 1234 5678"
                        className="h-12 rounded-2xl border-zinc-200 text-sm focus-visible:ring-zinc-900"
                    />
                </div>
            </div>

            <div className="sticky bottom-0 z-10 -mx-1 mt-1 border-t border-zinc-100 bg-white/95 px-1 pt-4 pb-[calc(0.85rem+env(safe-area-inset-bottom,0px))] supports-[backdrop-filter]:backdrop-blur">
                <SubmitButton />
            </div>
        </form>
    );
}
