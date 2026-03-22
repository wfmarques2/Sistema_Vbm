import { initializeApp, getApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.messagingSenderId) &&
  Boolean(firebaseConfig.appId) &&
  Boolean(import.meta.env.VITE_FIREBASE_VAPID_KEY);

function getFirebaseApp() {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

let foregroundListenerAttached = false;

export function setupForegroundPushNotifications() {
  if (!hasFirebaseConfig) return;
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (foregroundListenerAttached) return;
  const app = getFirebaseApp();
  const messaging = getMessaging(app);
  onMessage(messaging, (payload) => {
    const title = payload?.notification?.title || "Nova notificação";
    const body = payload?.notification?.body || "";
    try {
      const notification = new Notification(title, { body, data: payload?.data || {} });
      notification.onclick = () => {
        const serviceId = (payload?.data as any)?.serviceId;
        const path = serviceId ? `/agenda?serviceId=${encodeURIComponent(String(serviceId))}` : "/agenda";
        window.focus();
        window.location.href = path;
      };
    } catch {}
  });
  foregroundListenerAttached = true;
}

export async function getFirebaseMessagingToken() {
  if (!hasFirebaseConfig) return null;
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
  const permission =
    Notification.permission === "granted"
      ? "granted"
      : Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return null;
  const app = getFirebaseApp();
  const messaging = getMessaging(app);
  const serviceWorkerRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  });
  setupForegroundPushNotifications();
  return token;
}
