import { NextRequest, NextResponse } from "next/server";
import { confirmOverdue } from "@/lib/bonus";
import { checkCronSecret } from "@/lib/api";

/**
 * Запускается каждый час кроном на сервере:
 * curl -H "Authorization: Bearer $CRON_SECRET" https://xn--7-itbpoccheq.xn--p1ai/api/cron/auto-confirm
 */
export async function GET(req: NextRequest) {
  const denied = checkCronSecret(req);
  if (denied) return denied;

  const result = await confirmOverdue();
  return NextResponse.json({ ok: true, ...result });
}
