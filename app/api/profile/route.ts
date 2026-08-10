import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, parseBody } from "@/lib/api";
import { parseBirthDate } from "@/lib/format";

const schema = z.object({
  name: z.string().trim().min(1, "Укажите имя").max(60),
  birthDate: z.string().max(10).nullable(),
});

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Не авторизован", 401);

  const body = await parseBody(request, schema);
  if (!body.ok) return body.response;

  let birthDate: Date | null = null;
  if (body.data.birthDate) {
    birthDate = parseBirthDate(body.data.birthDate);
    if (!birthDate) return apiError("Проверьте дату рождения", 400);
  }

  await db.user.update({
    where: { id: session.userId },
    data: { name: body.data.name, birthDate },
  });
  return NextResponse.json({ ok: true });
}
