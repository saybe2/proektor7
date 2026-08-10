import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizePhone } from "@/lib/auth";
import { checkPhoneVerification } from "@/lib/otp";
import { db } from "@/lib/db";
import { apiError, parseBody } from "@/lib/api";

const schema = z.object({
  phone: z.string().min(10).max(20),
  attemptToken: z.string().length(48),
  mockCode: z.string().min(4).max(4).optional(),
});

export async function POST(req: NextRequest) {
  const body = await parseBody(req, schema, "Некорректная попытка проверки");
  if (!body.ok) return body.response;

  const phone = normalizePhone(body.data.phone);
  if (!phone) return apiError("Некорректная попытка проверки", 400);

  const result = await checkPhoneVerification(phone, body.data.attemptToken, body.data.mockCode);
  if (result.ok && result.verified) {
    const user = await db.user.findUnique({
      where: { phone },
      select: { isGuest: true },
    });
    // гостю, заведённому кассой, тоже нужно заполнить профиль: номер он
    // до этого не подтверждал и согласия не подписывал
    return NextResponse.json({ ...result, profileRequired: !user || user.isGuest });
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
