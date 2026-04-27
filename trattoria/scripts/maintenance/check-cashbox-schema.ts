import { prisma } from "../../src/lib/prisma";
import {
    CASHBOX_DB_UNREACHABLE_MESSAGE,
    CASHBOX_SCHEMA_REQUIRED_MESSAGE,
    checkCashboxSchema,
    isCashboxDbConnectionError,
} from "../../src/lib/cashboxSchema";

async function main() {
    console.log("Checking cashbox schema...");

    const result = await checkCashboxSchema(prisma);

    if (!result.isReady) {
        console.error(CASHBOX_SCHEMA_REQUIRED_MESSAGE);
        console.error(`Faltan: ${result.missingRequirements.join(", ")}`);
        process.exitCode = 1;
        return;
    }

    console.log("Cashbox schema ready.");
}

main()
    .catch((error) => {
        if (isCashboxDbConnectionError(error)) {
            console.error(CASHBOX_DB_UNREACHABLE_MESSAGE);
            process.exitCode = 1;
            return;
        }

        console.error("Cashbox schema check failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
