import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { sendPushToAll } from "@/lib/push";

const schema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(300),
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

  const { sent } = await sendPushToAll({ ...parsed.data, url: "/" });
  return NextResponse.json({ ok: true, sent });
}
