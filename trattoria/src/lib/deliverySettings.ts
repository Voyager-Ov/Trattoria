export interface DeliverySettings {
    enabled: boolean;
    deliveryFeeNear: number;
    deliveryFeeFar: number;
    estimatedTimeRange: string;
    allowPickup: boolean;
    allowDelivery: boolean;
}

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
    enabled: true,
    deliveryFeeNear: 0,
    deliveryFeeFar: 0,
    estimatedTimeRange: "30-45 min",
    allowPickup: true,
    allowDelivery: true,
};

function coerceNumber(value: unknown, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
}

export function normalizeDeliverySettings(value: unknown): DeliverySettings {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { ...DEFAULT_DELIVERY_SETTINGS };
    }

    const raw = value as Record<string, unknown>;
    const legacyFee = coerceNumber(raw.deliveryFee, 0);

    return {
        enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_DELIVERY_SETTINGS.enabled,
        deliveryFeeNear: coerceNumber(raw.deliveryFeeNear, legacyFee),
        deliveryFeeFar: coerceNumber(raw.deliveryFeeFar, legacyFee),
        estimatedTimeRange:
            typeof raw.estimatedTimeRange === "string"
                ? raw.estimatedTimeRange
                : DEFAULT_DELIVERY_SETTINGS.estimatedTimeRange,
        allowPickup:
            typeof raw.allowPickup === "boolean" ? raw.allowPickup : DEFAULT_DELIVERY_SETTINGS.allowPickup,
        allowDelivery:
            typeof raw.allowDelivery === "boolean" ? raw.allowDelivery : DEFAULT_DELIVERY_SETTINGS.allowDelivery,
    };
}
