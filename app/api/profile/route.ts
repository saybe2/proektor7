import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(1, "Укажите имя").max(60),
  birthDate: z.string().nullable(),
});

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Не авторизован" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Некорректные данные" }, { status: 400 });

  let birthDate: Date | null = null;
  if (parsed.data.birthDate) {
    birthDate = new Date(`${parsed.data.birthDate}T12:00:00`);
    const now = new Date();
    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 120);
    if (Number.isNaN(birthDate.getTime()) || birthDate > now || birthDate < minDate) {
      return NextResponse.json({ ok: false, error: "Проверьте дату рождения" }, { status: 400 });
    }
  }

  await db.user.update({ where: { id: session.userId }, data: { name: parsed.data.name, birthDate } });
  return NextResponse.json({ ok: true });
}
