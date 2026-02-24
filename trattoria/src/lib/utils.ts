import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

// Helper to serialize Prisma Decimal objects and others not supported by Client Components
export function serializePrisma(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  // Handle Decimal objects (Prisma/Decimal.js) structural check
  if (typeof obj === 'object' && obj !== null) {
    const maybeDecimal = obj as Record<string, unknown>;
    if (
      (maybeDecimal.constructor && maybeDecimal.constructor.name === 'Decimal') ||
      maybeDecimal._isDecimal === true ||
      (maybeDecimal.s !== undefined && maybeDecimal.d !== undefined && typeof maybeDecimal.toString === 'function')
    ) {
      return Number(maybeDecimal.toString());
    }
  }

  // Handle Dates
  if (obj instanceof Date) {
    return obj;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(serializePrisma);
  }

  // Handle Objects
  if (typeof obj === 'object' && obj !== null) {
    const serialized: Record<string, unknown> = {};
    const objDict = obj as Record<string, unknown>;
    for (const key in objDict) {
      if (Object.prototype.hasOwnProperty.call(objDict, key)) {
        const value = objDict[key];
        // Skip functions as they can't be passed to Client Components
        if (typeof value === 'function') continue;
        serialized[key] = serializePrisma(value);
      }
    }
    return serialized;
  }

  return obj;
}
