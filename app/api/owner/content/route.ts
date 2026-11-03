import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, guardOwner, isRecordNotFound } from "@/lib/api";
import { withAudit } from "@/lib/audit";

// Единый CRUD для контента: комнаты / меню / игры

const roomSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(1000).default(""),
  minCapacity: z.number().int().min(1).max(100).default(2),
  capacity: z.number().int().min(1).max(100),
  price: z.number().int().min(0).max(1_000_000),
  images: z.array(z.string().max(500)).max(30).default([]),
  sort: z.number().int().min(0).max(10_000).default(0),
  active: z.boolean().default(true),
});

const menuSchema = z.object({
  category: z.string().min(1).max(50),
  name: z.string().min(1).max(80),
  description: z.string().max(300).default(""),
  price: z.number().int().min(0).max(1_000_000),
  image: z.string().max(500).nullable().optional(),
  sort: z.number().int().min(0).max(10_000).default(0),
  available: z.boolean().default(true),
});

const gameSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).default(""),
  players: z.string().max(20).default(""),
  sort: z.number().int().min(0).max(10_000).default(0),
});

type Entity = "room" | "menu" | "game";

function getEntity(req: NextRequest): Entity | null {
  const e = req.nextUrl.searchParams.get("entity");
  return e === "room" || e === "menu" || e === "game" ? e : null;
}

export async function GET(req: NextRequest) {
  const access = await guardOwner();
  if (!access.ok) return access.response;

  const entity = getEntity(req);
  if (!entity) return apiError("Неизвестный раздел контента", 400);

  const items =
    entity === "room"
      ? await db.room.findMany({ orderBy: { sort: "asc" } })
      : entity === "menu"
        ? await db.menuItem.findMany({ orderBy: [{ category: "asc" }, { sort: "asc" }] })
        : await db.game.findMany({ orderBy: { sort: "asc" } });

  return NextResponse.json({ ok: true, items });
}

async function postContent(req: NextRequest) {
  const access = await guardOwner();
  if (!access.ok) return access.response;

  const entity = getEntity(req);
  if (!entity) return apiError("Неизвестный раздел контента", 400);

  const body = await req.json().catch(() => null);
  const id: string | undefined = typeof body?.id === "string" ? body.id : undefined;
  // при обновлении схема частичная: не пришедшее поле не должно
  // затираться значением из .default()
  const schema = entity === "room" ? roomSchema : entity === "menu" ? menuSchema : gameSchema;
  const parsed = id ? schema.partial().safeParse(body?.data) : schema.safeParse(body?.data);
  if (!parsed.success) return apiError("Некорректные данные", 400);

  try {
    if (entity === "room") {
      const input = parsed.data as Partial<z.infer<typeof roomSchema>>;
      const { images, ...rest } = input;
      const data = images ? { ...rest, images: JSON.stringify(images) } : rest;
      const item = id
        ? await db.room.update({ where: { id }, data })
        : await db.room.create({ data: data as z.infer<typeof roomSchema> & { images: string } });
      return NextResponse.json({ ok: true, item });
    }

    if (entity === "menu") {
      const data = parsed.data as z.infer<typeof menuSchema>;
      const item = id
        ? await db.menuItem.update({ where: { id }, data })
        : await db.menuItem.create({ data });
      return NextResponse.json({ ok: true, item });
    }

    const data = parsed.data as z.infer<typeof gameSchema>;
    const item = id
      ? await db.game.update({ where: { id }, data })
      : await db.game.create({ data });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (isRecordNotFound(error)) return apiError("Запись не найдена", 404);
    throw error;
  }
}

async function deleteContent(req: NextRequest) {
  const access = await guardOwner();
  if (!access.ok) return access.response;

  const entity = getEntity(req);
  const id = req.nextUrl.searchParams.get("id");
  if (!entity || !id) return apiError("Не указан раздел или запись", 400);

  try {
    if (entity === "room") await db.room.delete({ where: { id } });
    else if (entity === "menu") await db.menuItem.delete({ where: { id } });
    else await db.game.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error)) return apiError("Запись не найдена", 404);
    throw error;
  }

  return NextResponse.json({ ok: true });
}
export const POST = withAudit(postContent);
export const DELETE = withAudit(deleteContent);
