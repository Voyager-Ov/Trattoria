"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/serverAuth";
import { normalizeDeliverySettings } from "@/lib/deliverySettings";

// --- Configuration Schemas ---

const BusinessProfileSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    address: z.string().min(1, "La dirección es requerida"),
    logo: z.string().url().optional().or(z.literal("")),
});

const PaymentMethodSchema = z.object({
    id: z.string(),
    label: z.string(),
    enabled: z.boolean(),
    sortOrder: z.number(),
});

// F-09: accessToken removed from DB schema — stored in MERCADOPAGO_ACCESS_TOKEN env var only.
// Only publicKey (non-secret, browser-safe) and enabled status live in the DB.
const MercadoPagoSchema = z.object({
    publicKey: z.string().optional().or(z.literal("")),
    enabled: z.boolean(),
    // accessToken intentionally omitted — env var only, never persisted in DB
});

const BusinessClosedDaysSchema = z.array(z.string());

const BusinessHoursSchema = z.record(
    z.string(),
    z.array(z.object({
        start: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Formato HH:mm inválido"),
        end: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Formato HH:mm inválido"),
    }))
);


const DeliverySettingsSchema = z.object({
    enabled: z.boolean(),
    deliveryFeeNear: z.number().min(0).default(0),
    deliveryFeeFar: z.number().min(0).default(0),
    estimatedTimeRange: z.string(),
    allowPickup: z.boolean(),
    allowDelivery: z.boolean(),
});

const DeliveryZoneSchema = z.object({
    id: z.string(),
    name: z.string(),
    fee: z.number().min(0),
    enabled: z.boolean(),
});

const WhatsAppSettingsSchema = z.object({
    phoneNumber: z.string(),
    templateMessage: z.string(),
    enabled: z.boolean(),
});

const MonthlyGoalSchema = z.object({
    amount: z.number().min(0, "La meta debe ser un valor positivo."),
    type: z.enum(["revenue", "profit"]),
});


const ConfigSchemas: Record<string, z.ZodTypeAny> = {
    "business.profile": BusinessProfileSchema,
    "payments.methods": z.array(PaymentMethodSchema),
    "integrations.mercadoPago": MercadoPagoSchema,
    "business.hours": BusinessHoursSchema,
    "business.closedDays": BusinessClosedDaysSchema,
    "delivery.settings": DeliverySettingsSchema,
    "delivery.zones": z.array(DeliveryZoneSchema),
    "whatsapp.settings": WhatsAppSettingsSchema,
    "goals.monthly": MonthlyGoalSchema,
};

// --- Actions ---

/**
 * Fetch multiple configuration values by their keys.
 */
export async function getConfigs(keys: string[]) {
    try {
        const configs = await prisma.appConfig.findMany({
            where: {
                key: { in: keys },
            },
        });

        // Convert to a record for easier consumption
        const result: Record<string, any> = {};
        configs.forEach((c) => {
            result[c.key] = c.key === "delivery.settings"
                ? normalizeDeliverySettings(c.value)
                : c.value;
        });

        return { success: true, data: result };
    } catch (error) {
        console.error("Error fetching configs:", error);
        return { success: false, error: "Error al obtener la configuración" };
    }
}

/**
 * Save multiple configuration values in a single transaction.
 */
export async function saveConfigs(payload: Record<string, any>) {
    // F-04b: Only ADMIN can change business configuration
    await requireAdmin();
    try {
        // Validation step
        const validatedData: Record<string, any> = {};

        for (const [key, value] of Object.entries(payload)) {
            const schema = ConfigSchemas[key];
            if (!schema) {
                console.warn(`Attempted to save unknown config key: ${key}`);
                continue; // Or throw error based on strictness requirements
            }

            const normalizedValue = key === "delivery.settings"
                ? normalizeDeliverySettings(value)
                : value;

            const validation = schema.safeParse(normalizedValue);
            if (!validation.success) {
                return {
                    success: false,
                    error: `Validación fallida para ${key}: ${validation.error.errors[0].message}`
                };
            }
            validatedData[key] = validation.data;
        }

        // Transactional update
        await prisma.$transaction(
            Object.entries(validatedData).map(([key, value]) =>
                prisma.appConfig.upsert({
                    where: { key },
                    update: { value: value as any },
                    create: { key, value: value as any },
                })
            )
        );

        revalidatePath("/admin/dashboard/configuracion");
        revalidatePath("/admin/dashboard/pedidos");
        revalidatePath("/"); // Public site

        return { success: true };
    } catch (error) {
        console.error("Error saving configs:", error);
        return { success: false, error: "Error al guardar la configuración" };
    }
}
