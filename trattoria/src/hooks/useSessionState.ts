"use client";

import { useState, useEffect } from "react";

export function useSessionState<T>(key: string, initialValue: T) {
    const [state, setState] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                window.sessionStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error(error);
            }
        }
    }, [key, state]);

    return [state, setState] as const;
}
