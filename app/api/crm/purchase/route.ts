import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/auth";
import { findOrCreateGuest, recordPurchase } from "@/lib/bonus";
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

  // Незнакомый номер заводим как гостя: бонусы копятся до регистрации,
  // иначе кэшбэк за визит терялся бы навсегда. Но при списании гостя не
  // создаём — иначе неудачная попытка оставляла бы пустую запись.
  const existing = await db.user.findUnique({ where: { phone } });
  if (!existing && body.data.bonusesToSpend > 0) {
    return apiError("Гость не зарегистрирован на сайте — списать бонусы нельзя", 400);
  }

  const user = existing ?? (await findOrCreateGuest(phone));
  if (user.role !== "CLIENT") {
    return apiError("Операцию можно провести только для клиента", 400);
  }

  const result = await recordPurchase({
    userId: user.id,
    amount: body.data.amount,
    bonusesToSpend: body.data.bonusesToSpend,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
