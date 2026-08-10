import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError, guardStaff } from "@/lib/api";

export async function GET(req: NextRequest) {
  const access = await guardStaff();
  if (!access.ok) return access.response;
  const isOwner = access.user.role === "OWNER";

  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 60) || "";
  if (q.length < 2) {
    return apiError("Минимум 2 символа", 400);
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
    select: { id: true, phone: true, name: true, bonusBalance: true, isGuest: true, createdAt: true },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    clients: clients.map((client) => ({
      ...client,
      phone: isOwner ? client.phone : client.phone.slice(-4),
    })),
    phoneMasked: !isOwner,
  });
}
