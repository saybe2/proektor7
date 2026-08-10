import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, normalizePhone } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";
import { apiError, parseBody } from "@/lib/api";

const schema = z.object({
  name: z.string().max(60).optional(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(1000),
});

export async function POST(req: NextRequest) {
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  let user = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    console.error("[feedback] getCurrentUser failed", err);
    user = null;
  }

  const name = body.data.name || user?.name || null;
  // номер нормализуем: иначе ограничение по частоте обходится сменой формата
  const phone = body.data.phone
    ? normalizePhone(body.data.phone) || body.data.phone.trim()
    : user?.phone || null;
  const message = body.data.message;

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
      return apiError("Слишком часто. Попробуйте через минуту.", 429);
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
