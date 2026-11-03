import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardStaff, parseBody } from "@/lib/api";
import { recordPurchase } from "@/lib/bonus";
import { BONUS } from "@/lib/config";

const schema = z.object({
  userId: z.string().min(1).max(40),
  amount: z.number().int().positive().max(BONUS.MAX_CHECK),
  bonusesToSpend: z.number().int().min(0).max(BONUS.MAX_CHECK).default(0),
});

import { withAudit } from "@/lib/audit";
export const POST = withAudit(handler);
async function handler(req: NextRequest) {
  const access = await guardStaff();
  if (!access.ok) return access.response;

  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  const result = await recordPurchase({
    ...body.data,
    adminId: access.user.id,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
