import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/auth";
import { apiError, checkCrmKey } from "@/lib/api";

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
    return NextResponse.json({ ok: true, client: { found: false } });
  }
  return NextResponse.json({
    ok: true,
    client: { found: true, name: user.name, bonusBalance: user.bonusBalance },
  });
}
