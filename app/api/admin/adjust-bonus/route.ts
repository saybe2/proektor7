import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, guardOwner, parseBody } from "@/lib/api";

const schema = z.object({
  userId: z.string().min(1).max(40),
  amount: z
    .number()
    .int()
    .min(-1_000_000)
    .max(1_000_000)
    .refine((v) => v !== 0, "Сумма не может быть 0"),
  comment: z.string().max(200).optional(),
});

import { withAudit } from "@/lib/audit";
export const POST = withAudit(handler);
async function handler(req: NextRequest) {
  const access = await guardOwner();
  if (!access.ok) return access.response;
  const staff = access.user;

  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  const { userId, amount, comment } = body.data;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return apiError("Клиент не найден", 404);
  }

  // Списание проводим условным апдейтом внутри транзакции: между чтением
  // баланса и записью его мог изменить параллельный чек.
  const result = await db.$transaction(async (tx) => {
    if (amount < 0) {
      const updated = await tx.user.updateMany({
        where: { id: userId, bonusBalance: { gte: Math.abs(amount) } },
        data: { bonusBalance: { increment: amount } },
      });
      if (updated.count !== 1) {
        return { error: `Недостаточно бонусов (на счету ${user.bonusBalance})`, balance: 0 };
      }
    } else {
      await tx.user.update({
        where: { id: userId },
        data: { bonusBalance: { increment: amount } },
      });
    }

    await tx.bonusTransaction.create({
      data: {
        userId,
        amount,
        type: "MANUAL",
        status: "CONFIRMED",
        // телефон сотрудника в комментарий не пишем — клиент видит его в кабинете
        comment: comment || `Корректировка (${staff.name || "владелец"})`,
      },
    });

    const fresh = await tx.user.findUnique({
      where: { id: userId },
      select: { bonusBalance: true },
    });
    return { error: null, balance: fresh?.bonusBalance ?? 0 };
  });

  if (result.error !== null) return apiError(result.error, 400);

  return NextResponse.json({ ok: true, newBalance: result.balance });
}
