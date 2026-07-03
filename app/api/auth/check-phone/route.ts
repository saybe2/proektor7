import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const phone = normalizePhone(String(body?.phone || ""));
  if (!phone) {
    return NextResponse.json({ exists: false });
  }
  const user = await db.user.findUnique({ where: { phone }, select: { id: true } });
  return NextResponse.json({ exists: !!user });
}
