import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  id: z.string(),
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

  await db.feedback.update({ where: { id: parsed.data.id }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
