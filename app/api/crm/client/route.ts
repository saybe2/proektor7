import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/auth";

function checkKey(req: NextRequest): boolean {
  const key = process.env.CRM_API_KEY;
  if (!key) return false;
  const provided = req.headers.get("x-api-key") || "";
  const a = Buffer.from(provided);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!checkKey(req)) {
    return NextResponse.json({ ok: false, error: "Нет доступа" }, { status: 403 });
  }
  const phone = normalizePhone(req.nextUrl.searchParams.get("phone") || "");
  if (!phone) {
    return NextResponse.json({ ok: false, error: "Некорректный телефон" }, { status: 400 });
  }
  const user = await db.user.findUnique({ where: { phone } });
  if (!user || user.role === "OWNER") {
    return NextResponse.json({ ok: true, client: { found: false } });
  }
  return NextResponse.json({
    ok: true,
    client: { found: true, name: user.name, bonusBalance: user.bonusBalance },
  });
}
