import { getConfigs } from "@/app/actions/configActions";
import ConfigFormClient from "./components/ConfigFormClient";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
    const keys = [
        "business.profile",
        "business.hours",
        "business.closedDays",
        "payments.methods",
        "integrations.mercadoPago",
        "ops.settings",
        "whatsapp.settings",
        "delivery.settings",
        "delivery.zones",
        "goals.monthly"
    ];

    const result = await getConfigs(keys);
    const initialData = (result.success && result.data) ? result.data : {};

    return (
        <div className="bg-zinc-50/50">
            <ConfigFormClient initialData={initialData} />
        </div>
    );
}
