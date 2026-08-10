import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/auth";
import { recordPurchase } from "@/lib/bonus";

function checkKey(req: NextRequest): boolean {
  const key = process.env.CRM_API_KEY;
  if (!key) return false;
  const provided = req.headers.get("x-api-key") || "";
  const a = Buffer.from(provided);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

const schema = z.object({
  phone: z.string().min(10),
  amount: z.number().int().positive(),
  bonusesToSpend: z.number().int().min(0).default(0),
});

export async function POST(req: NextRequest) {
  if (!checkKey(req)) {
    return NextResponse.json({ ok: false, error: "Нет доступа" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректные данные" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ ok: false, error: "Некорректный телефон" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "Клиент не найден" }, { status: 404 });
  }

  const result = await recordPurchase({
    userId: user.id,
    amount: parsed.data.amount,
    bonusesToSpend: parsed.data.bonusesToSpend,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
