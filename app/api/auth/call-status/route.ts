import { NextRequest, NextResponse } from "next/server";
import { normalizePhone } from "@/lib/auth";
import { checkPhoneVerification } from "@/lib/otp";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const phone = normalizePhone(String(body?.phone || ""));
  const attemptToken = String(body?.attemptToken || "");
  const mockCode = body?.mockCode ? String(body.mockCode) : undefined;
  if (!phone || attemptToken.length !== 48) {
    return NextResponse.json({ ok: false, error: "Некорректная попытка проверки" }, { status: 400 });
  }

  const result = await checkPhoneVerification(phone, attemptToken, mockCode);
  if (result.ok && result.verified) {
    const user = await db.user.findUnique({ where: { phone }, select: { id: true } });
    return NextResponse.json({ ...result, profileRequired: !user });
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
