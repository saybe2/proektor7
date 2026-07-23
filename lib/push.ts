import webpush from "web-push";
import { db } from "./db";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "https://проектор7.рф",
    pub,
    priv
  );
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

/** Отправка пуша конкретному пользователю (на все его устройства) */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) {
    console.warn("[push] VAPID-ключи не настроены, пуш пропущен");
    return { sent: 0 };
  }

  const subs = await db.pushSubscription.findMany({ where: { userId } });
  let sent = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: unknown) {
      // подписка мертва (410/404) — удаляем
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
  return { sent };
}

/** Массовая рассылка всем подписанным клиентам */
export async function sendPushToAll(payload: PushPayload) {
  const users = await db.pushSubscription.findMany({
    select: { userId: true },
    distinct: ["userId"],
  });
  let total = 0;
  for (const { userId } of users) {
    const { sent } = await sendPushToUser(userId, payload);
    total += sent;
  }
  return { sent: total };
}
