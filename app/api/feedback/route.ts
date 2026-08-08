import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

const schema = z.object({
  name: z.string().max(60).optional(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(1000),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректные данные" }, { status: 400 });
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const name = parsed.data.name || user?.name || null;
  const phone = parsed.data.phone || user?.phone || null;
  const message = parsed.data.message;

  const since = new Date(Date.now() - 60_000);
  const identifiers = [
    ...(user ? [{ userId: user.id }] : []),
    ...(phone ? [{ phone }] : []),
  ];
  if (identifiers.length > 0) {
    const recent = await db.feedback.findFirst({
      where: { createdAt: { gt: since }, OR: identifiers },
      select: { id: true },
    });
    if (recent) {
      return NextResponse.json(
        { ok: false, error: "Слишком часто. Попробуйте через минуту." },
        { status: 429 }
      );
    }
  }

  await db.feedback.create({
    data: { userId: user?.id ?? null, name, phone, message },
  });

  try {
    const owners = await db.user.findMany({ where: { role: "OWNER" }, select: { id: true } });
    for (const owner of owners) {
      try {
        await sendPushToUser(owner.id, {
          title: "Новое сообщение директору",
          body: message.slice(0, 120),
          url: "/owner/feedback",
        });
      } catch (err) {
        console.error("[feedback] push owner failed", err);
      }
    }
  } catch (err) {
    console.error("[feedback] notify owners failed", err);
  }

  return NextResponse.json({ ok: true });
}
