'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProfile } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button disabled={pending} type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-12 font-bold shadow-lg shadow-zinc-200 transition-all">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
        </Button>
    );
}

export function ProfileForm({ user }: { user: any }) {
    const [state, action] = useActionState(updateProfile, {});

    useEffect(() => {
        if (state.success) {
            toast.success(state.message);
        } else if (state.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <form action={action} className="space-y-6">
            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label htmlFor="email" className="font-semibold text-zinc-700">Email</Label>
                    <Input id="email" value={user.email} disabled className="bg-zinc-50 border-zinc-200 text-zinc-500 rounded-xl h-11" />
                    <p className="text-xs text-zinc-400">El email no se puede cambiar directamente.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="displayName" className="font-semibold text-zinc-700">Nombre Completo</Label>
                    <Input id="displayName" name="displayName" defaultValue={user.displayName || ''} placeholder="Tu nombre" className="rounded-xl h-11 border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone" className="font-semibold text-zinc-700">Teléfono</Label>
                    <Input id="phone" name="phone" defaultValue={user.phone || ''} placeholder="+56 9 ..." className="rounded-xl h-11 border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900" />
                </div>
            </div>
            <div className="pt-4">
                <SubmitButton />
            </div>
        </form>
    );
}
