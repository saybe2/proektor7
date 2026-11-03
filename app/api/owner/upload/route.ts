import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { apiError, guardOwner } from "@/lib/api";

const MAX_SIZE = 8 * 1024 * 1024; // 8 МБ

/**
 * Тип определяем по сигнатуре файла, а не по заголовку от клиента:
 * иначе под именем .jpg можно положить в публичную папку что угодно.
 */
function detectExtension(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return ".png";
  }
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff === "RIFF" && webp === "WEBP") return ".webp";
  return null;
}

import { withAudit } from "@/lib/audit";
export const POST = withAudit(handler);
async function handler(req: NextRequest) {
  const access = await guardOwner();
  if (!access.ok) return access.response;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return apiError("Файл не передан", 400);
  }
  if (file.size > MAX_SIZE) {
    return apiError("Файл больше 8 МБ", 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = detectExtension(bytes);
  if (!ext) {
    return apiError("Только JPG, PNG или WebP", 400);
  }

  const name = crypto.randomBytes(8).toString("hex") + ext;
  const dir = path.join(process.cwd(), "public", "img", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);

  return NextResponse.json({ ok: true, url: `/img/uploads/${name}` });
}
