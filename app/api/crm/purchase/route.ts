import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/auth";
import { recordPurchase } from "@/lib/bonus";
import { apiError, checkCrmKey, parseBody } from "@/lib/api";
import { BONUS } from "@/lib/config";

const schema = z.object({
  phone: z.string().min(10).max(20),
  amount: z.number().int().positive().max(BONUS.MAX_CHECK),
  bonusesToSpend: z.number().int().min(0).max(BONUS.MAX_CHECK).default(0),
});

export async function POST(req: NextRequest) {
  if (!checkCrmKey(req)) {
    return apiError("Нет доступа", 403);
  }

  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  const phone = normalizePhone(body.data.phone);
  if (!phone) {
    return apiError("Некорректный телефон", 400);
  }

  const user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    return apiError("Клиент не найден", 404);
  }

  const result = await recordPurchase({
    userId: user.id,
    amount: body.data.amount,
    bonusesToSpend: body.data.bonusesToSpend,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
