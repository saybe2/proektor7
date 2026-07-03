import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";

// Единый CRUD для контента: комнаты / меню / игры

const roomSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(1000).default(""),
  capacity: z.number().int().min(1).max(100),
  price: z.number().int().min(0),
  images: z.array(z.string()).default([]),
  sort: z.number().int().default(0),
  active: z.boolean().default(true),
});

const menuSchema = z.object({
  category: z.string().min(1).max(50),
  name: z.string().min(1).max(80),
  description: z.string().max(300).default(""),
  price: z.number().int().min(0),
  sort: z.number().int().default(0),
  available: z.boolean().default(true),
});

const gameSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).default(""),
  players: z.string().max(20).default(""),
  sort: z.number().int().default(0),
});

type Entity = "room" | "menu" | "game";

function getEntity(req: NextRequest): Entity | null {
  const e = req.nextUrl.searchParams.get("entity");
  return e === "room" || e === "menu" || e === "game" ? e : null;
}

async function guard() {
  try {
    await requireOwner();
    return null;
  } catch {
    return NextResponse.json({ ok: false, error: "Нет доступа" }, { status: 403 });
  }
}

export async function GET(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const entity = getEntity(req);
  if (!entity) return NextResponse.json({ ok: false, error: "entity?" }, { status: 400 });

  const items =
    entity === "room"
      ? await db.room.findMany({ orderBy: { sort: "asc" } })
      : entity === "menu"
        ? await db.menuItem.findMany({ orderBy: [{ category: "asc" }, { sort: "asc" }] })
        : await db.game.findMany({ orderBy: { sort: "asc" } });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const entity = getEntity(req);
  if (!entity) return NextResponse.json({ ok: false, error: "entity?" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const id: string | undefined = body?.id || undefined;

  if (entity === "room") {
    const parsed = roomSchema.safeParse(body?.data);
    if (!parsed.success)
      return NextResponse.json({ ok: false, error: "Некорректные данные" }, { status: 400 });
    const data = { ...parsed.data, images: JSON.stringify(parsed.data.images) };
    const item = id
      ? await db.room.update({ where: { id }, data })
      : await db.room.create({ data });
    return NextResponse.json({ ok: true, item });
  }

  if (entity === "menu") {
    const parsed = menuSchema.safeParse(body?.data);
    if (!parsed.success)
      return NextResponse.json({ ok: false, error: "Некорректные данные" }, { status: 400 });
    const item = id
      ? await db.menuItem.update({ where: { id }, data: parsed.data })
      : await db.menuItem.create({ data: parsed.data });
    return NextResponse.json({ ok: true, item });
  }

  const parsed = gameSchema.safeParse(body?.data);
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "Некорректные данные" }, { status: 400 });
  const item = id
    ? await db.game.update({ where: { id }, data: parsed.data })
    : await db.game.create({ data: parsed.data });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const entity = getEntity(req);
  const id = req.nextUrl.searchParams.get("id");
  if (!entity || !id)
    return NextResponse.json({ ok: false, error: "entity/id?" }, { status: 400 });

  if (entity === "room") await db.room.delete({ where: { id } });
  else if (entity === "menu") await db.menuItem.delete({ where: { id } });
  else await db.game.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
