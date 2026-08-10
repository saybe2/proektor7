import { NextRequest, NextResponse } from "next/server";
import { runBirthdayPushes } from "@/lib/birthday";
import { checkCronSecret } from "@/lib/api";

/**
 * Запускается раз в день кроном на сервере:
 * curl -H "Authorization: Bearer $CRON_SECRET" https://xn--7-itbpoccheq.xn--p1ai/api/cron/birthday
 */
export async function GET(req: NextRequest) {
  const denied = checkCronSecret(req);
  if (denied) return denied;

  const result = await runBirthdayPushes();
  return NextResponse.json({ ok: true, ...result });
}
