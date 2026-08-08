import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

const schema = z.object({
  userId: z.string(),
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(300),
});

export async function POST(req: NextRequest) {
  try {
    await requireOwner();
  } catch {
    return NextResponse.json({ ok: false, error: "Нет доступа" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректные данные" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ ok: false, error: "Клиент не найден" }, { status: 404 });
  }

  const { sent } = await sendPushToUser(user.id, {
    title: parsed.data.title,
    body: parsed.data.body,
    url: "/cabinet",
  });
  if (sent === 0) {
    return NextResponse.json(
      { ok: false, error: "У клиента нет включённых уведомлений" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, sent });
}
