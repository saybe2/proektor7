"use client";

import { useState } from "react";

export default function ProfileForm({ initialName, initialBirthDate, phone }: { initialName: string; initialBirthDate: string; phone: string }) {
  const [name, setName] = useState(initialName);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, birthDate: birthDate || null }),
      });
      const data = await response.json();
      setMessage(data.ok ? { ok: true, text: "Данные сохранены" } : { ok: false, text: data.error || "Не удалось сохранить" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="card p-5 md:p-7">
      <div className="eyebrow text-brand mb-3">Профиль</div>
      <h2 className="h-display text-2xl mb-5">Личные данные</h2>
      <div className="space-y-4">
        <div><label className="label" htmlFor="profile-name">Имя</label><input id="profile-name" className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} autoComplete="name" /></div>
        <div><label className="label">Номер телефона</label><input className="input opacity-65" value={`+${phone}`} readOnly /><p className="text-xs text-[#66656f] mt-1">Номер используется для входа. Для его смены обратитесь к владельцу.</p></div>
        <div><label className="label" htmlFor="profile-birthday">Дата рождения</label><input id="profile-birthday" className="input" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /><p className="text-xs text-[#66656f] mt-1">Нужна для персональной скидки и напоминаний перед днём рождения.</p></div>
      </div>
      {message && <p className={`mt-4 text-sm font-bold ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
      <button className="btn-brand mt-5 w-full sm:w-auto" disabled={busy || !name.trim()}>{busy ? "Сохраняем..." : "Сохранить изменения"}</button>
    </form>
  );
}
