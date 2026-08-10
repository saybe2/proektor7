import { NextResponse, type NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import type { z } from "zod";
import { requireOwner, requireStaff } from "./auth";

/** Единый формат ответа с ошибкой для всех роутов */
export function apiError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

type Denied = { ok: false; response: NextResponse };
type Allowed<T> = { ok: true; user: T };

/**
 * Проверка доступа. Отказ в правах — 403, любая другая ошибка (например,
 * недоступная БД) не маскируется под отказ, а логируется и отдаёт 503.
 */
async function guard<T>(check: () => Promise<T>, context: string): Promise<Allowed<T> | Denied> {
  try {
    return { ok: true, user: await check() };
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { ok: false, response: apiError("Нет доступа", 403) };
    }
    console.error(`[api] ${context} failed`, error);
    return { ok: false, response: apiError("Сервис временно недоступен", 503) };
  }
}

export function guardOwner() {
  return guard(requireOwner, "requireOwner");
}

export function guardStaff() {
  return guard(requireStaff, "requireStaff");
}

/** Разбор JSON-тела с валидацией схемой */
export async function parseBody<S extends z.ZodType>(
  req: Request,
  schema: S,
  errorMessage = "Некорректные данные"
): Promise<{ ok: true; data: z.output<S> } | Denied> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return { ok: false, response: apiError(errorMessage, 400) };
  }
  return { ok: true, data: parsed.data };
}

/** Сравнение секретов без утечки длины и времени сравнения */
export function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Ключ интеграции с CRM (заголовок x-api-key) */
export function checkCrmKey(req: NextRequest): boolean {
  const key = process.env.CRM_API_KEY;
  if (!key) return false;
  return secretsMatch(req.headers.get("x-api-key") || "", key);
}

/** Доступ к cron-роутам. Возвращает ответ с ошибкой либо null, если доступ разрешён. */
export function checkCronSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return apiError("Cron is not configured", 503);
    }
    return null;
  }
  if (!secretsMatch(req.headers.get("authorization") || "", `Bearer ${secret}`)) {
    return apiError("Нет доступа", 401);
  }
  return null;
}

/**
 * Ошибка Prisma «запись не найдена» (P2025). Позволяет ответить 404
 * вместо падения роута с 500 и HTML-страницей вместо JSON.
 */
export function isRecordNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025";
}
