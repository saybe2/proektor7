import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guardOwner, apiError, parseBody } from "@/lib/api";
import { withAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { hoursSchema } from "@/lib/hours";

export const POST = withAudit(async (req: NextRequest) => {
  const access = await guardOwner();
  if (!access.ok) return access.response;
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://xn--7-itbpoccheq.xn--p1ai").origin;
  if (req.headers.get("origin") !== origin) return apiError("Неверный источник запроса", 403);
  const parsed = await parseBody(req, hoursSchema);
  if (!parsed.ok) return parsed.response;
  const value = JSON.stringify(parsed.data);
  await db.siteSetting.upsert({
    where: { key: "businessHours" },
    create: { key: "businessHours", value }, update: { value },
  });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
});
