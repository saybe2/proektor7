"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function PushToggle({ alwaysVisible = false }: { alwaysVisible?: boolean }) {
  const [supported] = useState(() => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, [supported]);

  async function toggle() {
    setLoading(true);
    setError("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();

      if (existing) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        await existing.unsubscribe();
        setSubscribed(false);
        return;
      }

      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        setError("Уведомления пока не настроены на сервере.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Браузер не получил разрешение. Проверьте настройки уведомлений для сайта.");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  }

  if (!supported && !alwaysVisible) return null;

  return (
    <div className="card p-5 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="font-extrabold text-brand-dark">Уведомления</div>
        <p className="text-sm text-[#3c3c6e]">
          Акции, скидки и напоминание о подарке на день рождения
        </p>
        {!supported && <p className="text-sm font-bold text-red-600 mt-2">Этот браузер не поддерживает web-push. На iPhone установите сайт на экран «Домой» и откройте его с иконки.</p>}
        {error && <p className="text-sm font-bold text-red-600 mt-2">{error}</p>}
      </div>
      <button
        className={subscribed ? "btn-outline !py-2 !px-4 text-sm shrink-0" : "btn-brand !py-2 !px-4 text-sm shrink-0"}
        onClick={toggle}
        disabled={loading || !supported}
      >
        {subscribed ? "Отключить" : "Включить"}
      </button>
    </div>
  );
}
