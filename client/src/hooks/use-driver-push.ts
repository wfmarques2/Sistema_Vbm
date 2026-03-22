import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getFirebaseMessagingToken } from "@/lib/firebase-messaging";

export function useDriverPushRegistration() {
  const { user, isAuthenticated } = useAuth();
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if ((user?.role || "operational") !== "driver") return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;

    void (async () => {
      const dedupeKey = `push-token:${user?.id || "driver"}`;
      const statusKey = `push-token-status:${user?.id || "driver"}`;
      try {
        const token = await getFirebaseMessagingToken();
        if (!token) {
          localStorage.setItem(statusKey, "no-token");
          return;
        }
        const lastToken = localStorage.getItem(dedupeKey);
        if (lastToken === token) {
          localStorage.setItem(statusKey, "already-registered");
          return;
        }
        const response = await fetch("/api/notifications/fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            token,
            platform: "web",
          }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          console.error("[push] falha ao registrar token", response.status, body);
          const message = String(body?.message || "").replace(/\s+/g, "_").slice(0, 80);
          localStorage.setItem(statusKey, `api-error:${response.status}:${message || "unknown"}`);
          return;
        }
        localStorage.setItem(dedupeKey, token);
        localStorage.setItem(statusKey, "ok");
      } catch (error) {
        console.error("[push] erro ao preparar token", error);
        localStorage.setItem(statusKey, "exception");
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [isAuthenticated, user?.driverId, user?.role]);
}
