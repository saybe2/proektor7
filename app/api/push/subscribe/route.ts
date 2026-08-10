import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, parseBody } from "@/lib/api";

// endpoint приходит от браузера и уходит в исходящий запрос web-push,
// поэтому проверяем схему и длину, а не только наличие значения
const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000).startsWith("https://"),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().max(1000),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return apiError("Не авторизован", 401);
  }

  const body = await parseBody(req, subscriptionSchema);
  if (!body.ok) return body.response;

  const { endpoint, keys } = body.data;
  await db.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: session.userId, p256dh: keys.p256dh, auth: keys.auth },
    create: {
      userId: session.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return apiError("Не авторизован", 401);
  }

  const body = await parseBody(req, unsubscribeSchema);
  if (!body.ok) return body.response;

  await db.pushSubscription.deleteMany({
    where: { endpoint: body.data.endpoint, userId: session.userId },
  });
  return NextResponse.json({ ok: true });
}
