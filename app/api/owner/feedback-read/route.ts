import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, guardOwner, isRecordNotFound, parseBody } from "@/lib/api";

const schema = z.object({
  id: z.string().min(1).max(40),
});

import { withAudit } from "@/lib/audit";
export const POST = withAudit(handler);
async function handler(req: NextRequest) {
  const access = await guardOwner();
  if (!access.ok) return access.response;

  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  try {
    await db.feedback.update({ where: { id: body.data.id }, data: { isRead: true } });
  } catch (error) {
    if (isRecordNotFound(error)) return apiError("Сообщение не найдено", 404);
    throw error;
  }
  return NextResponse.json({ ok: true });
}
