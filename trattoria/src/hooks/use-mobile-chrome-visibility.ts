"use client";

import { useEffect } from "react";

let mobileChromeLocks = 0;

function syncMobileChromeVisibility() {
    if (typeof document === "undefined") {
        return;
    }

    if (mobileChromeLocks > 0) {
        document.body.dataset.mobileChromeHidden = "true";
    } else {
        delete document.body.dataset.mobileChromeHidden;
    }
}

export function useMobileChromeVisibility(active: boolean) {
    useEffect(() => {
        if (!active) {
            return;
        }

        mobileChromeLocks += 1;
        syncMobileChromeVisibility();

        return () => {
            mobileChromeLocks = Math.max(0, mobileChromeLocks - 1);
            syncMobileChromeVisibility();
        };
    }, [active]);
}
