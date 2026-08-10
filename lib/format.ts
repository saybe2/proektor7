// Единые форматы дат и ссылок в интерфейсе

/** 5 августа, 19:48 */
export function formatDateTime(value: Date | string): string {
  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 5 августа 2026 */
export function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Ссылка для звонка из отображаемого номера */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

/**
 * Дата рождения из поля YYYY-MM-DD. Разбираем в локальный полдень:
 * при разборе как UTC-полночь дата съезжает на день в минусовых поясах.
 */
export function parseBirthDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const oldest = new Date();
  oldest.setFullYear(now.getFullYear() - 120);
  if (date > now || date < oldest) return null;
  return date;
}

/** Значение для <input type="date"> */
export function dateInputValue(date: Date | null): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
