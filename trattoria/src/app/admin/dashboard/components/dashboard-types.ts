export interface DashboardMetrics {
    totalSales: number;
    salesToday: number;
    salesGrowth: string;
    totalOrdersToday: number;
    pendingOrders: number;
    activeCustomers: number;
    monthlyGoal: {
        amount: number;
        currentAmount: number;
        progress: number;
        type: string;
    };
    weeklyRevenue: {
        day: string;
        revenue: number;
    }[];
}

export interface RecentActivityItem {
    id: string;
    numero: string;
    clienteNombre: string | null;
    total: number;
    estado: string;
    recibidoEn: string;
    items: {
        nombreProduct: string;
        cantidad: number;
    }[];
}
