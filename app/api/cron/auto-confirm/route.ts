import { NextRequest, NextResponse } from "next/server";
import { confirmOverdue } from "@/lib/bonus";

/**
 * Запускается каждый час кроном на сервере:
 * curl -H "Authorization: Bearer $CRON_SECRET" https://xn--7-itbpoccheq.xn--p1ai/api/cron/auto-confirm
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
  const result = await confirmOverdue();
  return NextResponse.json({ ok: true, ...result });
}
