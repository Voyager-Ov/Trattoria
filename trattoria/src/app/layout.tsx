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
        <html lang="es">
            <body className={cn(inter.variable, outfit.variable, "font-sans antialiased min-h-screen bg-background")}>
                <CartProvider>
                    {children}
                    <Toaster position="top-center" richColors />
                </CartProvider>
            </body>
        </html>
    );
}


