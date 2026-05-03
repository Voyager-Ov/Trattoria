"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, ShoppingBag, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Mock login logic
            if (email === "admin@trattoria.com" && password === "admin") {
                router.push("/admin/dashboard");
            } else {
                throw new Error("Credenciales inválidas");
            }
        } catch (err: any) {
            setError(err.message || "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    const loginGoogle = async () => {
        setLoading(true);
        setError("");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "No tienes permisos para acceder al sistema");
            }

            router.push("/admin/dashboard");
        } catch (error: any) {
            console.error("Error logging in with Google", error);
            setError(error.message || "Error al iniciar sesión con Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50/50 p-4 relative overflow-hidden font-sans">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-[420px] relative z-10">
                {/* Logo above card */}
                <div className="flex justify-center mb-8">
                    <div className="relative group cursor-default">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-50 group-hover:scale-100 transition-transform duration-500" />
                        <div className="relative w-16 h-16 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center shadow-sm">
                            <ChefHat className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                </div>

                <Card className="border-zinc-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] bg-white/80 backdrop-blur-xl">
                    <CardHeader className="space-y-3 text-center pb-8 pt-10 px-8">
                        <CardTitle className="text-3xl font-black tracking-tight text-zinc-900 font-display">
                            Bienvenido
                        </CardTitle>
                        <CardDescription className="text-zinc-500 text-base font-medium">
                            Panel de Administración Trattoria
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6 px-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold text-zinc-700 ml-1">
                                    Correo electrónico
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@trattoria.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium shadow-none px-4"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs font-bold text-zinc-700 ml-1">
                                        Contraseña
                                    </Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-[11px] font-semibold text-zinc-400 hover:text-primary transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium shadow-none px-4"
                                />
                            </div>

                            {error && (
                                <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600">
                                        <span className="text-[10px] font-bold">!</span>
                                    </div>
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl text-[15px] font-bold bg-zinc-900 hover:bg-primary text-white shadow-md shadow-zinc-200 transition-all hover:shadow-primary/25 hover:-translate-y-0.5 mt-2"
                            >
                                {loading ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Ingresar <ArrowRight className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-100" />
                            </div>
                            <div className="relative flex justify-center text-xs font-semibold text-zinc-400">
                                <span className="bg-white px-4">
                                    O continúa con
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            type="button"
                            onClick={loginGoogle}
                            disabled={loading}
                            className="w-full h-12 rounded-xl border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-900 font-semibold transition-all shadow-sm"
                        >
                            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
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
                            Google
                        </Button>
                    </CardContent>
                    
                    <CardFooter className="flex justify-center pb-8 pt-4 px-8 bg-zinc-50/50 rounded-b-[2rem] border-t border-zinc-100/80 mt-6">
                        <Link href="/" className="group flex items-center gap-2 text-[13px] font-semibold text-zinc-500 hover:text-primary transition-colors">
                            <ShoppingBag className="w-4 h-4 text-zinc-400 group-hover:text-primary transition-colors" />
                            <span>Ir al Catálogo Público</span>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
            
            {/* Minimal footer */}
            <div className="absolute bottom-6 text-center w-full text-[11px] font-medium text-zinc-400">
                Trattoria v2.1.0 • Gestión Administrativa
            </div>
        </div>
    );
}
