import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardOwner, parseBody } from "@/lib/api";
import { sendPushToAll } from "@/lib/push";

const schema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(300),
});

export async function POST(req: NextRequest) {
  const access = await guardOwner();
  if (!access.ok) return access.response;

  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  const { sent } = await sendPushToAll({ ...body.data, url: "/" });
  return NextResponse.json({ ok: true, sent });
}
