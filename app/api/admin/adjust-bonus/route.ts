import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

const schema = z.object({
  userId: z.string(),
  amount: z.number().int().refine((v) => v !== 0, "Сумма не может быть 0"),
  comment: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  let staff;
  try {
    staff = await requireStaff();
  } catch {
    return NextResponse.json({ ok: false, error: "Нет доступа" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректные данные" }, { status: 400 });
  }

  const { userId, amount, comment } = parsed.data;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "Клиент не найден" }, { status: 404 });
  }
  if (amount < 0 && user.bonusBalance + amount < 0) {
    return NextResponse.json(
      { ok: false, error: `Недостаточно бонусов (на счету ${user.bonusBalance})` },
      { status: 400 }
    );
  }

  await db.$transaction([
    db.bonusTransaction.create({
      data: {
        userId,
        amount,
        type: "MANUAL",
        comment: comment || `Корректировка (${staff.name || staff.phone})`,
      },
    }),
    db.user.update({
      where: { id: userId },
      data: { bonusBalance: { increment: amount } },
    }),
  ]);

  return NextResponse.json({ ok: true, newBalance: user.bonusBalance + amount });
}
