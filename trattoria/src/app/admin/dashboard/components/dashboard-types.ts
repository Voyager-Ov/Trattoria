export interface DashboardMetrics {
    todayRevenue: number;
    todayOrders: number;
    todayAverageTicket: number;
    ordersInKitchen: number;
    unavailableProductsCount: number;
    criticalSuppliesCount: number;
    suppliesBelowMinimumCount: number;
    todayPaymentMethods: {
        methodId: string;
        label: string;
        amount: number;
        count: number;
    }[];
    todayRevenueByHour: {
        hour: string;
        revenue: number;
        orders: number;
    }[];
    todayOrdersByStatus: {
        status: string;
        count: number;
    }[];
    topProduct: {
        id: string;
        nombre: string;
        count: number;
        revenue: number;
        periodLabel: string;
    } | null;
    criticalSuppliesPreview: {
        id: string;
        nombre: string;
        stockActual: number;
        stockMinimo: number;
        unidad: string;
    }[];
    unavailableProductsPreview: {
        id: string;
        nombre: string;
        categoryName: string | null;
    }[];
    alertCounts: {
        criticalSupplies: number;
        unavailableProducts: number;
        finalizedUnpaid: number;
        paidUnfinalized: number;
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
