"use client";

/** Единый разбор ответа API для клиентских форм */
export type ApiResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/**
 * POST на внутренний API. Сетевая ошибка и неожиданный ответ приводятся
 * к тому же виду, что и штатная ошибка, — форма всегда может показать текст.
 */
export async function postJson<T = Record<string, unknown>>(
  url: string,
  body: unknown,
  init?: { method?: string }
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: init?.method || "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return { ok: false, error: "Не удалось связаться с сервером" };
    }
    const result = data as ApiResult<T>;
    if (!result.ok) {
      return { ok: false, error: result.error || "Не удалось выполнить действие" };
    }
    return result;
  } catch {
    return { ok: false, error: "Ошибка сети. Попробуйте ещё раз." };
  }
}

/** GET на внутренний API с тем же контрактом, что и postJson */
export async function getJson<T = Record<string, unknown>>(
  url: string
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return { ok: false, error: "Не удалось связаться с сервером" };
    }
    const result = data as ApiResult<T>;
    if (!result.ok) {
      return { ok: false, error: result.error || "Не удалось загрузить данные" };
    }
    return result;
  } catch {
    return { ok: false, error: "Ошибка сети. Попробуйте ещё раз." };
  }
}
