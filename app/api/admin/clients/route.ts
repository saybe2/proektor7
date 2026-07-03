import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ ok: false, error: "Нет доступа" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json({ ok: false, error: "Минимум 2 символа" });
  }

  const digits = q.replace(/\D/g, "");
  const clients = await db.user.findMany({
    where: {
      role: "CLIENT",
      OR: [
        ...(digits.length >= 2 ? [{ phone: { contains: digits } }] : []),
        { name: { contains: q } },
      ],
    },
    select: {
      id: true,
      phone: true,
      name: true,
      bonusBalance: true,
      createdAt: true,
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, clients });
}
