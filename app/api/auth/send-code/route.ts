import { NextRequest, NextResponse } from "next/server";
import { normalizePhone } from "@/lib/auth";
import { sendOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const phone = normalizePhone(String(body?.phone || ""));
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "Введите корректный номер телефона" },
      { status: 400 }
    );
  }

  const result = await sendOtp(phone);
  if (!result.ok) {
    return NextResponse.json(result, { status: 429 });
  }
  return NextResponse.json({ ok: true, channel: result.channel });
}
