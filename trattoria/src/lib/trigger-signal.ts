import { adminDb } from "./firebase-admin";

/**
 * Triggers a real-time signal in Firestore so that connected clients
 * can immediately refetch orders or data without polling.
 */
export async function triggerOrderSignal() {
    try {
        await adminDb.collection("system").doc("signals").set({
            lastOrderUpdate: Date.now()
        }, { merge: true });
    } catch (e) {
        console.error("Failed to trigger order signal in Firestore", e);
    }
}
