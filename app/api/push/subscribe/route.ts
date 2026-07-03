import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { endpoint, keys } = body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ ok: false, error: "Некорректная подписка" }, { status: 400 });
  }

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
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (body?.endpoint) {
    await db.pushSubscription
      .deleteMany({ where: { endpoint: body.endpoint, userId: session.userId } });
  }
  return NextResponse.json({ ok: true });
}
