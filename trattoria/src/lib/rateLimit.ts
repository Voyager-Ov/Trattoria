/**
 * rateLimit.ts
 * Zero-dependency in-process sliding window rate limiter.
 *
 * Works on a single Next.js server instance (Node.js runtime).
 * For multi-instance deployments, replace with Upstash or Redis.
 *
 * Usage:
 *   const result = rateLimit(ip, { limit: 5, windowMs: 60_000 });
 *   if (!result.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface RateLimitEntry {
    timestamps: number[];
    blockedUntil?: number;
}

// In-memory store. Auto-clears every 10 min to prevent unbounded growth.
const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (
            entry.timestamps.length === 0 &&
            (!entry.blockedUntil || entry.blockedUntil < now)
        ) {
            store.delete(key);
        }
    }
}, CLEANUP_INTERVAL_MS);

export interface RateLimitOptions {
    /** Max requests allowed in the window */
    limit: number;
    /** Window size in milliseconds */
    windowMs: number;
    /** Optional: block for this many ms after exceeding limit (default: windowMs) */
    blockMs?: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    /** How many ms until requests are allowed again (when !allowed) */
    retryAfterMs: number;
}

export function rateLimit(
    key: string,
    options: RateLimitOptions
): RateLimitResult {
    const { limit, windowMs, blockMs = windowMs } = options;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
    }

    // Check if currently in a block period
    if (entry.blockedUntil && now < entry.blockedUntil) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterMs: entry.blockedUntil - now,
        };
    }

    // Slide the window: drop timestamps older than windowMs
    entry.timestamps = entry.timestamps.filter(ts => now - ts < windowMs);

    if (entry.timestamps.length >= limit) {
        // Set block
        entry.blockedUntil = now + blockMs;
        return {
            allowed: false,
            remaining: 0,
            retryAfterMs: blockMs,
        };
    }

    entry.timestamps.push(now);

    return {
        allowed: true,
        remaining: limit - entry.timestamps.length,
        retryAfterMs: 0,
    };
}

/**
 * Get the real client IP from a Next.js request.
 * Works with Vercel, Cloudflare, and local dev.
 */
export function getClientIp(request: Request): string {
    const headers = [
        'x-forwarded-for',
        'x-real-ip',
        'cf-connecting-ip', // Cloudflare
    ];
    for (const header of headers) {
        const value = (request as any).headers?.get?.(header);
        if (value) {
            // x-forwarded-for can be a comma-separated list; take the first
            return value.split(',')[0].trim();
        }
    }
    return '127.0.0.1';
}
