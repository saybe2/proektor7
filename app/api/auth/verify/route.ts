import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, createSession } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { createUserWithWelcomeBonus } from "@/lib/bonus";

const schema = z.object({
  phone: z.string(),
  code: z.string().min(3).max(6),
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

  const check = await verifyOtp(phone, parsed.data.code);
  if (!check.ok) {
    return NextResponse.json(check, { status: 400 });
  }

  let user = await db.user.findUnique({ where: { phone } });
  let isNew = false;

  if (!user) {
    // регистрация
    let birthDate: Date | undefined;
    if (parsed.data.birthDate) {
      const d = new Date(parsed.data.birthDate);
      if (!isNaN(d.getTime())) birthDate = d;
    }
    user = await createUserWithWelcomeBonus({
      phone,
      name: parsed.data.name?.trim() || undefined,
      birthDate,
      refCode: parsed.data.refCode?.trim().toUpperCase() || undefined,
    });
    isNew = true;
  }

  await createSession(user.id, user.role);
  return NextResponse.json({ ok: true, isNew, role: user.role });
}
