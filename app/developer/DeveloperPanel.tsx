"use client";
import { useCallback, useEffect, useState } from "react";

type User = { id: string; phone: string; name: string | null; role: string; createdAt: string; isGuest: boolean };
type Log = { id: string; createdAt: string; actorId: string | null; action: string; target: string; status: number; detail: string };
type Data = { users: User[]; logs: Log[]; settings: { key: string; value: string }[]; technical: { runtime: string; database: string; otpProvider: string; pushConfigured: boolean } };
export default function DeveloperPanel({ currentUserId }: { currentUserId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (q = "", reset = false) => {
    const r = await fetch(`/api/developer?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const d = await r.json(); if (!r.ok) throw new Error(d.error || "Ошибка загрузки");
    setData(d);
    if (reset) { setText(d.settings.find((s: { key: string }) => s.key === "announcement")?.value || ""); setEnabled(d.settings.find((s: { key: string }) => s.key === "announcementEnabled")?.value === "true"); }
  }, []);
  useEffect(() => { load("", true).catch(e => setError(e.message)); }, [load]);
  async function save(body: object) {
    setBusy(true); setError("");
    try { const r = await fetch("/api/developer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Ошибка сохранения"); await load(query); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка сети"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-8">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <section className="card p-5"><h2 className="font-bold text-xl mb-4">Аккаунты и роли</h2>
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); load(query).catch(e => setError(e.message)); }}><input aria-label="Телефон или имя" className="border p-2 flex-1" placeholder="Телефон или имя (от 2 символов)" value={query} onChange={e => setQuery(e.target.value)} /><button className="btn-outline">Найти</button></form>
      <div className="overflow-auto mt-4"><table className="text-sm w-full text-left"><thead><tr><th className="p-2">Аккаунт</th><th className="p-2">Дата создания аккаунта (МСК)</th><th className="p-2">Роль</th></tr></thead><tbody>{data?.users.map(u => <tr key={u.id} className="border-t"><td className="p-2">{u.name || "Без имени"}<br />{u.phone}</td><td className="p-2 whitespace-nowrap"><time dateTime={u.createdAt}>{new Date(u.createdAt).toLocaleString("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time>{u.isGuest && <span className="block text-xs whitespace-normal">Гость — регистрация не завершена</span>}</td><td className="p-2"><select aria-label={`Роль ${u.phone}`} disabled={busy || u.id === currentUserId} value={u.role} onChange={e => { const role = e.target.value; if (confirm(`Изменить роль ${u.phone}: ${u.role} → ${role}?`)) void save({ action: "role", userId: u.id, role }); }}>{["CLIENT", "ADMIN", "OWNER", "DEVELOPER"].map(r => <option key={r}>{r}</option>)}</select></td></tr>)}</tbody></table></div>
      <p className="text-xs mt-3">Дата из записи аккаунта. Для гостей это дата добавления кассой, а не подтверждения телефона.</p>
      <p className="text-sm mt-4">Свою роль менять нельзя. Изменения прав проверяются по БД при каждом запросе.</p>
    </section>
    <section className="card p-5"><h2 className="font-bold text-xl mb-4">Технические настройки</h2>
      <p className="text-sm mb-4">{data?.technical.runtime} · БД: {data?.technical.database} · Вход: {data?.technical.otpProvider} · Push: {data?.technical.pushConfigured ? "настроен" : "не настроен"}</p>
      <label className="block"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Показывать объявление на сайте</label>
      <textarea aria-label="Объявление" className="border p-2 w-full my-3" maxLength={300} value={text} onChange={e => setText(e.target.value)} />
      <button disabled={busy} className="btn-outline" onClick={() => save({ action: "settings", announcement: text, enabled })}>Сохранить</button>
      <p className="text-sm mt-3">Секреты, SSH и финансовые правила здесь недоступны.</p>
    </section>
    <section className="card p-5"><h2 className="font-bold text-xl mb-4">Журнал действий и ошибок</h2><p className="text-sm mb-3">Последние 100 записей. Журнал начинается с этого обновления; тела запросов и секреты не сохраняются.</p>
      <div className="overflow-auto"><table className="text-sm w-full"><thead><tr><th>Время</th><th>Действие</th><th>Объект / инициатор</th><th>Статус</th></tr></thead><tbody>{data?.logs.map(l => <tr key={l.id} className="border-t"><td className="p-2 whitespace-nowrap">{new Date(l.createdAt).toLocaleString("ru-RU")}</td><td>{l.action}</td><td className="p-2 break-all">{l.target} {l.detail}<br />{l.actorId || "Система"}</td><td>{l.status}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
}
