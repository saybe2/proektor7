import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardOwner, parseBody } from "@/lib/api";
import { confirmPurchase, rejectPurchase } from "@/lib/bonus";

const schema = z.object({
  purchaseId: z.string().min(1).max(40),
  action: z.enum(["confirm", "reject"]),
});

export async function POST(req: NextRequest) {
  const access = await guardOwner();
  if (!access.ok) return access.response;

  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  const result =
    body.data.action === "confirm"
      ? await confirmPurchase(body.data.purchaseId)
      : await rejectPurchase(body.data.purchaseId);

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
