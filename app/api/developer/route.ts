import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardDeveloper, apiError } from "@/lib/api";
import { withAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const access = await guardDeveloper();
  if (!access.ok) return access.response;
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 60) || "";
  const users = q.length >= 2 ? await db.user.findMany({
    where: { OR: [{ phone: { contains: q.replace(/\D/g, "") || "not-a-phone" } }, { name: { contains: q } }] },
    select: { id: true, phone: true, name: true, role: true, createdAt: true, isGuest: true }, take: 30,
  }) : [];
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const settings = await db.siteSetting.findMany({ where: { key: { in: ["announcement", "announcementEnabled"] } } });
  return NextResponse.json({ ok: true, users, logs, settings, technical: {
    runtime: "Next.js / Node.js", otpProvider: process.env.OTP_PROVIDER === "mock" ? "mock" : "phone verification",
    database: "connected", pushConfigured: Boolean(process.env.VAPID_PRIVATE_KEY),
  } });
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("role"), userId: z.string().min(1).max(100), role: z.enum(["CLIENT", "ADMIN", "OWNER", "DEVELOPER"]) }),
  z.object({ action: z.literal("settings"), announcement: z.string().trim().max(300), enabled: z.boolean() }),
]);
export const POST = withAudit(async (req: NextRequest) => {
  const access = await guardDeveloper();
  if (!access.ok) return access.response;
  // Prevent cross-site requests using a developer session.
  const origin = req.headers.get("origin");
  const allowedOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://xn--7-itbpoccheq.xn--p1ai").origin;
  if (origin !== allowedOrigin) return apiError("Неверный источник запроса", 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("Некорректные данные", 400);
  const input = parsed.data;
  if (input.action === "role") {
    if (input.userId === access.user.id) return apiError("Нельзя менять собственную роль", 400);
    const user = await db.user.findUnique({ where: { id: input.userId } });
    if (!user) return apiError("Аккаунт не найден", 404);
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { role: input.role } });
      await tx.auditLog.create({ data: { actorId: access.user.id, action: "ROLE_CHANGE", target: user.id, detail: `${user.role} -> ${input.role}`, status: 200 } });
    });
  } else {
    await db.$transaction([
      db.siteSetting.upsert({ where: { key: "announcement" }, create: { key: "announcement", value: input.announcement }, update: { value: input.announcement } }),
      db.siteSetting.upsert({ where: { key: "announcementEnabled" }, create: { key: "announcementEnabled", value: String(input.enabled) }, update: { value: String(input.enabled) } }),
    ]);
  }
  return NextResponse.json({ ok: true });
});
