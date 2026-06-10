const PARTIAL_DECIMAL_REGEX = /^-?\d*([.,]\d*)?$/;

export function sanitizeDecimalInput(value: string) {
    const trimmed = value.trim();

    if (trimmed === "") {
        return "";
    }

    return PARTIAL_DECIMAL_REGEX.test(trimmed) ? trimmed : null;
}

export function parseDecimalInput(value: string) {
    const normalized = value.trim().replace(",", ".");

    if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
        return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

export function formatParsedDecimal(value: string, fallback = 0, fractionDigits = 2) {
    const parsed = parseDecimalInput(value);
    return (parsed ?? fallback).toFixed(fractionDigits);
}
