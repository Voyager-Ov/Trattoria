import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
    title: 'Trattoria',
    description: 'Arroyito',
};

import { CartProvider } from '@/providers/CartProvider';
import { Toaster } from 'sonner';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="h-full bg-background">
            <body className={cn(inter.variable, outfit.variable, "min-h-[100dvh] font-sans antialiased bg-background")}>
                <CartProvider>
                    {children}
                    <Toaster position="top-center" richColors />
                </CartProvider>
            </body>
        </html>
    );
}


