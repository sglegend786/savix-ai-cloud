// VAPID Public Key (from backend .env)
const VAPID_PUBLIC_KEY = "BFWw1Da328Z3hwcOpnD-4whdBLve5otxUetL4ibymzCLm67DCZtk81LiXHsTvNZ9AAHCSdzmccTmCDXVLcnbApM";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Register Service Worker and subscribe to push
export const subscribeToPush = async (token) => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push notifications not supported in this browser");
    return;
  }

  try {
    // Register SW
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("✅ Service Worker registered");

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Push permission denied");
      return;
    }

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Send subscription to backend
    await fetch("/api/schemes/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });

    console.log("✅ Push subscription saved");
  } catch (err) {
    console.error("Push subscription failed:", err);
  }
};

// Unsubscribe
export const unsubscribeFromPush = async (token) => {
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (registration) {
      const sub = await registration.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    }
    await fetch("/api/schemes/push/unsubscribe", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Unsubscribed from push");
  } catch (err) {
    console.error("Unsubscribe failed:", err);
  }
};
