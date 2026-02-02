'use server';

import { getAuthenticatedUserServer } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type UpdateProfileState = {
    message?: string;
    error?: string;
    success?: boolean;
};

export async function updateProfile(prevState: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> {
    const user = await getAuthenticatedUserServer();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const displayName = formData.get('displayName') as string;
    const phone = formData.get('phone') as string;
    // Avatar handling could be here or client-side upload then set URL.
    // For now assuming we might receive a URL if handled by client, or just text fields.

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                displayName,
                phone,
            },
        });

        revalidatePath('/admin/dashboard/perfil');
        return { success: true, message: 'Perfil actualizado correctamente' };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { error: 'Error al actualizar el perfil' };
    }
}
