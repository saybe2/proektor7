import { NextRequest, NextResponse } from "next/server";
import { runBirthdayPushes } from "@/lib/birthday";

/**
 * Запускается раз в день кроном на сервере:
 * curl -H "Authorization: Bearer $CRON_SECRET" https://proektor7.ru/api/cron/birthday
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json({ ok: false, error: "Cron is not configured" }, { status: 503 });
  }
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }
  const result = await runBirthdayPushes();
  return NextResponse.json({ ok: true, ...result });
}
