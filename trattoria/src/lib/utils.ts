import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to serialize Prisma Decimal objects and others not supported by Client Components
export function serializePrisma(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Handle Decimal objects (Prisma/Decimal.js) structural check
  if (typeof obj === 'object' && (
    obj.constructor?.name === 'Decimal' ||
    obj._isDecimal === true ||
    (obj.s !== undefined && obj.d !== undefined && typeof obj.toString === 'function')
  )) {
    return Number(obj.toString());
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
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        // Skip functions as they can't be passed to Client Components
        if (typeof value === 'function') continue;
        serialized[key] = serializePrisma(value);
      }
    }
    return serialized;
  }

  return obj;
}
