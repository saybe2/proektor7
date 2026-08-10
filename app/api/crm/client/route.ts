import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/auth";
import { apiError, checkCrmKey } from "@/lib/api";
import { getBonusState } from "@/lib/bonus";
import { BONUS } from "@/lib/config";

/** Правила бонусной программы: CRM берёт их отсюда, чтобы не дублировать у себя */
const rules = {
  minCheckForRedeem: BONUS.MIN_CHECK_FOR_REDEEM,
  maxRedeemPercent: BONUS.MAX_REDEEM_PERCENT,
  cashbackPercent: BONUS.CASHBACK_PERCENT,
};

export async function GET(req: NextRequest) {
  if (!checkCrmKey(req)) {
    return apiError("Нет доступа", 403);
  }
  const phone = normalizePhone(req.nextUrl.searchParams.get("phone") || "");
  if (!phone) {
    return apiError("Некорректный телефон", 400);
  }
  const user = await db.user.findUnique({ where: { phone } });
  // чек можно провести только на клиента, поэтому сотрудников CRM не показываем
  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ ok: true, client: { found: false, rules } });
  }

  const { balance, pendingRedeem, available } = await getBonusState(user.id);

  return NextResponse.json({
    ok: true,
    client: {
      found: true,
      name: user.name,
      bonusBalance: balance,
      // списывать можно только подтверждённые бонусы, не занятые другим чеком
      available: user.isGuest ? 0 : Math.max(0, available),
      pendingRedeem,
      // гость заведён кассой: бонусы копятся, но до регистрации на сайте
      // списать их нельзя — номер не подтверждён
      isGuest: user.isGuest,
      rules,
    },
  });
}
