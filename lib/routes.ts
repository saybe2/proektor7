// Навигация по разделам кабинета. Модуль без серверных зависимостей —
// его можно импортировать и в клиентских компонентах.

/** Раздел кабинета для роли пользователя */
export function cabinetPath(role?: string | null): string {
  if (role === "OWNER") return "/owner";
  if (role === "ADMIN") return "/admin";
  return "/cabinet";
}
