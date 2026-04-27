// using Intl for timezone support
// We will use Intl for now or minimal date math.

export type TimeRange = {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
};

export type BusinessHours = Record<string, TimeRange[]>;

export interface StoreStatus {
    isOpen: boolean;
    message?: string;
    nextOpen?: Date;
}

const TIMEZONE = "America/Argentina/Cordoba";

export function getStoreStatus(
    hoursConfig: BusinessHours,
    closedDays: string[] = []
): StoreStatus {
    // 1. Get current time in target timezone
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        weekday: 'long'
    };

    // We need to parse the day name exactly as stored in config (Spanish, capitalized)
    // Intl returns lowercase usually: "lunes", "martes"...
    const formatter = new Intl.DateTimeFormat('es-AR', { ...options, weekday: 'long' });
    const parts = formatter.formatToParts(now);
    const dayNameLower = parts.find(p => p.type === 'weekday')?.value.toLowerCase() || "";

    // Map to config keys: "Lunes", "Martes"...
    const dayMap: Record<string, string> = {
        "lunes": "Lunes",
        "martes": "Martes",
        "miércoles": "Miércoles",
        "miercoles": "Miércoles", // handle potential accent issues
        "jueves": "Jueves",
        "viernes": "Viernes",
        "sábado": "Sábado",
        "sabado": "Sábado",
        "domingo": "Domingo"
    };

    const currentDayKey = dayMap[dayNameLower] || "";

    // 2. Check if today is a closed day explicitly
    if (closedDays.includes(currentDayKey)) {
        return { isOpen: false, message: "Hoy estamos cerrados." };
    }

    // 3. Check hours for today
    const ranges = hoursConfig[currentDayKey];
    if (!ranges || ranges.length === 0) {
        return { isOpen: false, message: "Hoy no estamos operando." };
    }

    // Parse current time to minutes for comparison
    // We can't trust parts order blindly, so let's use another formatter for time
    const timeFormatter = new Intl.DateTimeFormat('es-AR', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    // output example: "19:30"
    const timeString = timeFormatter.format(now);
    const [currentHour, currentMinute] = timeString.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    let isOpen = false;
    for (const range of ranges) {
        const [startH, startM] = range.start.split(':').map(Number);
        const [endH, endM] = range.end.split(':').map(Number);

        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        // Handle overnight ranges (e.g. 19:00 to 02:00) 
        // Logic: if end < start, it means it ends the next day.
        // If current time is > start (evening) OR < end (early morning next day)
        // BUT wait, "today" logic is tricky with overnight. 
        // For simplicity, let's assume ranges are within the day OR handle simplest overnight if needed.
        // Usually config "Lunes 19:00 - 23:00". 
        // If 19:00 - 02:00, usually implied it spills to Tuesday.
        // Validating "Lunes" at 01:00 AM Tuesday... technically it's Tuesday.
        // So strict day checking might fail for after-midnight hours if not duplicated on Tuesday.
        // Let's stick to strict day matching for now unless we see complexity.

        if (currentMinutes >= startTotal && currentMinutes < endTotal) {
            isOpen = true;
            break;
        }
    }

    if (isOpen) {
        return { isOpen: true };
    }

    return { isOpen: false, message: "Estamos cerrados por ahora." };
}
