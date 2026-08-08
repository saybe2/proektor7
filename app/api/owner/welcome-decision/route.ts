import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { confirmWelcome, rejectWelcome } from "@/lib/bonus";

const schema = z.object({
  userId: z.string(),
  action: z.enum(["confirm", "reject"]),
});

export async function POST(req: NextRequest) {
  try {
    await requireOwner();
  } catch {
    return NextResponse.json({ ok: false, error: "Нет доступа" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректные данные" }, { status: 400 });
  }

  const result =
    parsed.data.action === "confirm"
      ? await confirmWelcome(parsed.data.userId)
      : await rejectWelcome(parsed.data.userId);

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
