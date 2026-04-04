import { Separator } from '@/components/ui/separator';
import { getAuthenticatedUserServer } from '@/lib/auth';
import { KeyRound, Shield, User } from 'lucide-react';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { LinkedAccountsCard } from './linked-accounts-card';
import { ProfileForm } from './profile-form';
import { SecurityCard } from './security-card';

type SectionShellProps = {
    icon: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
    accentClassName: string;
};

function SectionShell({ icon, title, description, children, accentClassName }: SectionShellProps) {
    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className="flex items-start gap-3 px-4 py-4 md:px-6 md:py-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentClassName}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg font-black tracking-tight text-zinc-900 md:text-xl">{title}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{description}</p>
                </div>
            </div>
            <Separator />
            <div className="px-4 py-4 md:px-6 md:py-6">{children}</div>
        </section>
    );
}

export default async function AdminProfilePage() {
    const user = await getAuthenticatedUserServer();

    if (!user) {
        redirect('/api/auth/logout');
    }

    return (
        <div className="app-page-safe-bottom min-h-screen bg-zinc-50 px-3 py-4 md:px-5 md:py-6 xl:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6">
                <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
                    <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-end md:justify-between md:px-6 md:py-5">
                        <div className="min-w-0">
                            <div className="text-[0.65rem] font-black uppercase tracking-[0.34em] text-zinc-400 md:text-xs">
                                Cuenta
                            </div>
                            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
                                Mi Perfil
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-zinc-500 md:text-base">
                                Actualiza tus datos de contacto, seguridad de acceso y cuentas vinculadas.
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-200 md:h-14 md:w-14">
                            <User size={22} />
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)] xl:items-start">
                    <SectionShell
                        icon={<User size={20} />}
                        title="Informacion personal"
                        description="Tus datos basicos de contacto para operar en el panel."
                        accentClassName="bg-zinc-100 text-zinc-700"
                    >
                        <ProfileForm user={user} />
                    </SectionShell>

                    <div className="flex flex-col gap-4">
                        <SectionShell
                            icon={<KeyRound size={20} />}
                            title="Seguridad"
                            description="Configura tu contrasena o actualizala para mantener la cuenta protegida."
                            accentClassName="bg-orange-100 text-orange-600"
                        >
                            <SecurityCard />
                        </SectionShell>

                        <SectionShell
                            icon={<Shield size={20} />}
                            title="Cuentas vinculadas"
                            description="Gestiona los metodos que usas para iniciar sesion."
                            accentClassName="bg-blue-100 text-blue-600"
                        >
                            <LinkedAccountsCard />
                        </SectionShell>
                    </div>
                </div>

                <div
                    aria-hidden="true"
                    className="md:hidden"
                    style={{ minHeight: 'calc(var(--admin-mobile-nav-height) - 0.75rem)' }}
                />
            </div>
        </div>
    );
}
