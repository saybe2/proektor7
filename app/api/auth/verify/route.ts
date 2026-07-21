import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, createSession } from "@/lib/auth";
import { checkPhoneVerification } from "@/lib/otp";
import { createUserWithWelcomeBonus } from "@/lib/bonus";

const schema = z.object({
  phone: z.string(),
  attemptToken: z.string().length(48),
  mockCode: z.string().min(4).max(4).optional(),
  name: z.string().max(60).optional(),
  birthDate: z.string().optional(), // YYYY-MM-DD
  refCode: z.string().max(12).optional(),
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

  const result = await db.$transaction(async (tx) => {
    const consumed = await tx.otpCode.deleteMany({
      where: {
        phone,
        code: parsed.data.attemptToken,
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() },
      },
    });
    if (consumed.count !== 1) return null;

    const existing = await tx.user.findUnique({ where: { phone } });
    if (existing) return { user: existing, isNew: false };

    let birthDate: Date | undefined;
    if (parsed.data.birthDate) {
      const date = new Date(parsed.data.birthDate);
      if (!Number.isNaN(date.getTime())) birthDate = date;
    }
    const user = await createUserWithWelcomeBonus({
      phone,
      name: parsed.data.name?.trim() || undefined,
      birthDate,
      refCode: parsed.data.refCode?.trim().toUpperCase() || undefined,
    }, tx);
    return { user, isNew: true };
  });

  if (!result) {
    return NextResponse.json({ ok: false, error: "Проверка уже использована или истекла" }, { status: 400 });
  }
  await createSession(result.user.id, result.user.role);
  return NextResponse.json({ ok: true, isNew: result.isNew, role: result.user.role });
}
