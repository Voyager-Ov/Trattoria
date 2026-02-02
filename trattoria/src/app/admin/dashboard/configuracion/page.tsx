import { getConfigs } from "@/app/actions/configActions";
import ConfigFormClient from "./components/ConfigFormClient";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
    const keys = [
        "business.profile",
        "payments.methods",
        "integrations.mercadoPago",
        "ops.settings",
        "whatsapp.settings",
        "delivery.settings",
        "delivery.zones"
    ];

    const result = await getConfigs(keys);
    const initialData = (result.success && result.data) ? result.data : {};

    return (
        <div className="bg-zinc-50/50">
            <ConfigFormClient initialData={initialData} />
        </div>
    );
}
