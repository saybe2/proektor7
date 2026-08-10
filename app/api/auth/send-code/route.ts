import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizePhone } from "@/lib/auth";
import { startPhoneVerification } from "@/lib/otp";
import { db } from "@/lib/db";
import { PRIVACY_VERSION } from "@/lib/config";
import { apiError, parseBody } from "@/lib/api";

const schema = z.object({
  phone: z.string().min(10).max(20),
  privacyAccepted: z.literal(true, {
    message: "Для продолжения необходимо принять Политику обработки персональных данных",
  }),
});

export async function POST(req: NextRequest) {
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  const phone = normalizePhone(body.data.phone);
  if (!phone) {
    return apiError("Введите корректный номер телефона", 400);
  }

  const result = await startPhoneVerification(phone);
  if (!result.ok) {
    // 429 только для повторной попытки в пределах минуты, недоступность провайдера — 503
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.reason === "cooldown" ? 429 : 503 }
    );
  }

  // согласие фиксируем после успешного старта проверки, иначе в базе
  // остаются записи по номерам, которым звонок так и не ушёл
  await db.privacyConsent.upsert({
    where: { phone_version: { phone, version: PRIVACY_VERSION } },
    update: { acceptedAt: new Date() },
    create: { phone, version: PRIVACY_VERSION },
  });

  return NextResponse.json(result);
}
