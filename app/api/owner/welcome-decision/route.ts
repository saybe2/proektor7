import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardOwner, parseBody } from "@/lib/api";
import { confirmWelcome, rejectWelcome } from "@/lib/bonus";

const schema = z.object({
  userId: z.string().min(1).max(40),
  action: z.enum(["confirm", "reject"]),
});

export async function POST(req: NextRequest) {
  const access = await guardOwner();
  if (!access.ok) return access.response;

  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  const result =
    body.data.action === "confirm"
      ? await confirmWelcome(body.data.userId)
      : await rejectWelcome(body.data.userId);

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
