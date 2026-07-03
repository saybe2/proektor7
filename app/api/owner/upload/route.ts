import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 8 * 1024 * 1024; // 8 МБ
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(req: NextRequest) {
  try {
    await requireOwner();
  } catch {
    return NextResponse.json({ ok: false, error: "Нет доступа" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Файл не передан" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: "Только JPG, PNG или WebP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, error: "Файл больше 8 МБ" },
      { status: 400 }
    );
  }

  const name = crypto.randomBytes(8).toString("hex") + ext;
  const dir = path.join(process.cwd(), "public", "img", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ ok: true, url: `/img/uploads/${name}` });
}
