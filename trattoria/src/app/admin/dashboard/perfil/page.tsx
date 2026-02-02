import { getAuthenticatedUserServer } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileForm } from './profile-form';
import { SecurityCard } from './security-card';
import { LinkedAccountsCard } from './linked-accounts-card';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Key } from 'lucide-react';

export default async function AdminProfilePage() {
    const user = await getAuthenticatedUserServer();

    if (!user) {
        redirect('/api/auth/logout');
    }

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Mi Perfil</h1>
                    <p className="text-zinc-500 mt-2 text-lg">Gestiona tu información personal y seguridad.</p>
                </div>
                <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-zinc-200">
                    <User size={24} />
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Left Column: Personal Info (Larger) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-10 w-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900">Información Personal</h3>
                                <p className="text-zinc-500 text-sm">Tus datos básicos de contacto.</p>
                            </div>
                        </div>
                        <Separator className="mb-6" />
                        <ProfileForm user={user} />
                    </div>
                </div>

                {/* Right Column: Security & Connections */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Security Card */}
                    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                <Key size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900">Seguridad</h3>
                                <p className="text-zinc-500 text-sm">Cambia tu contraseña.</p>
                            </div>
                        </div>
                        <Separator className="mb-6" />
                        <SecurityCard />
                    </div>

                    {/* Linked Accounts */}
                    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900">Cuentas Vinculadas</h3>
                                <p className="text-zinc-500 text-sm">Gestiona el inicio de sesión.</p>
                            </div>
                        </div>
                        <Separator className="mb-6" />
                        <LinkedAccountsCard />
                    </div>
                </div>
            </div>
        </div>
    );
}
