export const SYSTEM_TIME_ZONE = "America/Argentina/Cordoba";
export const SYSTEM_TIME_LOCATION_LABEL = "Arroyito, Cordoba";

type DateInput = string | number | Date;

export function formatSystemDateTime(
    date: DateInput,
    options: Intl.DateTimeFormatOptions,
    locale = "es-AR"
) {
    return new Intl.DateTimeFormat(locale, {
        timeZone: SYSTEM_TIME_ZONE,
        ...options,
    }).format(new Date(date));
}

export function formatSystemClock(date: DateInput, locale = "es-AR") {
    return formatSystemDateTime(
        date,
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        },
        locale
    );
}

export function getSystemNow() {
    return new Date();
}
