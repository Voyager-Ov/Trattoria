import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Bienvenido al panel de administración.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1">Hoy: 27 Ene</Badge>
                </div>
            </div>

            {/* Stats Grid - Bento Style */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$450.200</div>
                        <p className="text-xs text-muted-foreground">+20.1% vs ayer</p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12</div>
                        <p className="text-xs text-muted-foreground">+4 ordenes nuevas</p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">573</div>
                        <p className="text-xs text-muted-foreground">+201 clientes</p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/80">Meta Mensual</CardTitle>
                        <TrendingUp className="h-4 w-4 text-white/80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">85%</div>
                        <p className="text-xs text-white/60">Casi llegamos!</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders or Chart Placeholder */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 rounded-3xl border-border/50">
                    <CardHeader>
                        <CardTitle>Resumen de Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-secondary/30 rounded-xl m-2">
                            Gráfico de Barras aquí
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 rounded-3xl border-border/50">
                    <CardHeader>
                        <CardTitle>Últimos Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-secondary/30">
                                    <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center font-bold text-xs border">
                                        JD
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Juan Perez</p>
                                        <p className="text-xs text-muted-foreground">2x Pizza Napolitana</p>
                                    </div>
                                    <div className="font-bold text-sm">$25.000</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
