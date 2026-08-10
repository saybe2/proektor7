import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, guardOwner, parseBody } from "@/lib/api";
import { sendPushToUser } from "@/lib/push";

const schema = z.object({
  userId: z.string().min(1).max(40),
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(300),
});

export async function POST(req: NextRequest) {
  const access = await guardOwner();
  if (!access.ok) return access.response;

  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  const user = await db.user.findUnique({ where: { id: body.data.userId } });
  if (!user || user.role !== "CLIENT") {
    return apiError("Клиент не найден", 404);
  }

  const { sent } = await sendPushToUser(user.id, {
    title: body.data.title,
    body: body.data.body,
    url: "/cabinet",
  });
  if (sent === 0) {
    return apiError("У клиента нет включённых уведомлений", 400);
  }
  return NextResponse.json({ ok: true, sent });
}
