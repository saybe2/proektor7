import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, createSession } from "@/lib/auth";
import { checkPhoneVerification } from "@/lib/otp";
import { createUserWithWelcomeBonus } from "@/lib/bonus";
import { PRIVACY_VERSION, MARKETING_VERSION, SERVICE_NOTIFY_VERSION } from "@/lib/config";
import { parseBirthDate } from "@/lib/format";

const schema = z.object({
  phone: z.string().min(10).max(20),
  attemptToken: z.string().length(48),
  mockCode: z.string().min(4).max(4).optional(),
  name: z.string().max(60).optional(),
  birthDate: z.string().max(10).optional(), // YYYY-MM-DD
  refCode: z.string().max(12).optional(),
  privacyAccepted: z.boolean().optional(),
  marketingAccepted: z.boolean().optional(),
  serviceNotifyAccepted: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Некорректные данные" },
      { status: 400 }
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "Некорректный номер" },
      { status: 400 }
    );
  }

  const check = await checkPhoneVerification(phone, parsed.data.attemptToken, parsed.data.mockCode);
  if (!check.ok || !check.verified) {
    return NextResponse.json(
      check.ok ? { ok: false, error: "Звонок ещё не получен" } : check,
      { status: 400 }
    );
  }

  const consent = await db.privacyConsent.findUnique({
    where: { phone_version: { phone, version: PRIVACY_VERSION } },
  });
  if (!consent || parsed.data.privacyAccepted !== true) {
    return NextResponse.json(
      { ok: false, error: "Необходимо принять Политику обработки персональных данных" },
      { status: 400 }
    );
  }

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { phone } });

    let birthDate: Date | undefined;
    if (!existing) {
      // общий разбор даты: иначе регистрация и профиль трактуют её
      // по-разному и день рождения съезжает на сутки
      const date = parsed.data.birthDate ? parseBirthDate(parsed.data.birthDate) : null;
      if (!date) return { birthDateError: true as const };
      birthDate = date;
      if (parsed.data.serviceNotifyAccepted !== true) return { serviceNotifyError: true as const };
      if (parsed.data.marketingAccepted !== true) return { marketingError: true as const };
    }

    const consumed = await tx.otpCode.deleteMany({
      where: {
        phone,
        code: parsed.data.attemptToken,
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() },
      },
    });
    if (consumed.count !== 1) return null;

    if (existing) {
      const user = await tx.user.update({
        where: { id: existing.id },
        data: {
          privacyAcceptedAt: consent.acceptedAt,
          privacyVersion: PRIVACY_VERSION,
        },
      });
      return { user, isNew: false };
    }

    const user = await createUserWithWelcomeBonus({
      phone,
      name: parsed.data.name?.trim() || undefined,
      birthDate,
      refCode: parsed.data.refCode?.trim().toUpperCase() || undefined,
      privacyAcceptedAt: consent.acceptedAt,
      privacyVersion: PRIVACY_VERSION,
    }, tx);
    if (parsed.data.marketingAccepted === true) {
      await tx.marketingConsent.upsert({
        where: { phone_version: { phone, version: MARKETING_VERSION } },
        create: { phone, version: MARKETING_VERSION },
        update: {},
      });
      await tx.user.update({
        where: { id: user.id },
        data: { marketingAcceptedAt: new Date(), marketingVersion: MARKETING_VERSION },
      });
    }
    await tx.serviceConsent.upsert({
      where: { phone_version: { phone, version: SERVICE_NOTIFY_VERSION } },
      create: { phone, version: SERVICE_NOTIFY_VERSION },
      update: {},
    });
    await tx.user.update({
      where: { id: user.id },
      data: { serviceNotifyAcceptedAt: new Date(), serviceNotifyVersion: SERVICE_NOTIFY_VERSION },
    });
    return { user, isNew: true };
  });

  if (result && "birthDateError" in result) {
    return NextResponse.json({ ok: false, error: "Укажите дату рождения" }, { status: 400 });
  }
  if (result && "serviceNotifyError" in result) {
    return NextResponse.json(
      { ok: false, error: "Подтвердите согласие на уведомления о бонусах — это условие бонусной программы" },
      { status: 400 }
    );
  }
  if (result && "marketingError" in result) {
    return NextResponse.json(
      { ok: false, error: "Подтвердите согласие на рекламные уведомления" },
      { status: 400 }
    );
  }
  if (!result) {
    return NextResponse.json({ ok: false, error: "Проверка уже использована или истекла" }, { status: 400 });
  }
  await createSession(result.user.id, result.user.role);
  return NextResponse.json({ ok: true, isNew: result.isNew, role: result.user.role });
}
