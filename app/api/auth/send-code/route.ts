import { NextRequest, NextResponse } from "next/server";
import { normalizePhone } from "@/lib/auth";
import { startPhoneVerification } from "@/lib/otp";
import { db } from "@/lib/db";
import { PRIVACY_VERSION } from "@/lib/config";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (body?.privacyAccepted !== true) {
    return NextResponse.json(
      { ok: false, error: "Для продолжения необходимо принять Политику обработки персональных данных" },
      { status: 400 }
    );
  }
  const phone = normalizePhone(String(body?.phone || ""));
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "Введите корректный номер телефона" },
      { status: 400 }
    );
  }

  await db.privacyConsent.upsert({
    where: { phone_version: { phone, version: PRIVACY_VERSION } },
    update: { acceptedAt: new Date() },
    create: { phone, version: PRIVACY_VERSION },
  });

  const result = await startPhoneVerification(phone);
  if (!result.ok) {
    return NextResponse.json(result, { status: 429 });
  }
  return NextResponse.json(result);
}
