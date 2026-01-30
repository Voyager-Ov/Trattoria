"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
    const { loginEmail, loginGoogle, error, loading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await loginEmail(email, password);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Decorative blurred blobs for bento aesthetic */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />

            <Card className="w-full max-w-md border-border/50 shadow-xl rounded-[2rem] bg-card/80 backdrop-blur-sm relative z-10 transition-all duration-300 hover:shadow-2xl">
                <CardHeader className="space-y-1 text-center pb-8 pt-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                            <ChefHat className="w-8 h-8" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                        Bienvenido
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-lg">
                        Ingresa a tu panel de Trattoria
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground/80 font-medium ml-1">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="usuario@trattoria.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 rounded-xl bg-background border-border/60 focus:border-primary focus:ring-primary/20 transition-all text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-foreground/80 font-medium ml-1">Contraseña</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
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
                                className="h-12 rounded-xl bg-background border-border/60 focus:border-primary focus:ring-primary/20 transition-all text-base"
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                ⚠️ {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? "Iniciando..." :
                                <span className="flex items-center gap-2">
                                    Ingresar <ArrowRight className="w-4 h-4 ml-1" />
                                </span>
                            }
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground font-medium">
                                O continúa con
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        onClick={loginGoogle}
                        disabled={loading}
                        className="w-full h-12 rounded-xl border-border hover:bg-secondary/50 hover:text-foreground font-medium transition-all hover:scale-[1.01]"
                    >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
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
                <CardFooter className="flex justify-center pb-8 pt-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <ShoppingBag className="w-4 h-4 text-primary" />
                        <Link href="/" className="hover:text-primary transition-colors hover:underline underline-offset-4">
                            Ir al Catálogo Público
                        </Link>
                    </div>
                </CardFooter>
            </Card>

            {/* Footer minimal */}
            <div className="absolute bottom-4 text-center w-full text-xs text-muted-foreground/60">
                © 2026 Trattoria App. All rights reserved.
            </div>
        </div>
    );
}
