import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { recordPurchase } from "@/lib/bonus";

const schema = z.object({
  userId: z.string(),
  amount: z.number().int().positive(),
  bonusesToSpend: z.number().int().min(0).default(0),
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

  const result = await recordPurchase({
    ...parsed.data,
    adminId: staff.id,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
