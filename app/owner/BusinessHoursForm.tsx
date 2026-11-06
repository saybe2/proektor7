"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessHours } from "@/lib/hours";

export default function BusinessHoursForm({ initial }: { initial: BusinessHours }) {
  const [hours, setHours] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/owner/hours", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(hours),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Не удалось сохранить график");
      setMessage("График сохранён и обновлён на сайте."); router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить график");
    } finally { setBusy(false); }
  }
  return (
    <form onSubmit={save} className="card p-6 mb-6">
      <h2 className="font-extrabold text-brand-dark mb-2">Часы работы</h2>
      <p className="text-sm text-[#3c3c6e] mb-4">Время по Москве. Если закрытие раньше открытия, работаем до следующего дня.</p>
      <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-4">
        {([
          ["weekdayOpen", "Вс–чт: открытие"], ["weekdayClose", "Вс–чт: закрытие"],
          ["weekendOpen", "Пт–сб: открытие"], ["weekendClose", "Пт–сб: закрытие"],
        ] as const).map(([key, label]) => (
          <label key={key} className="text-sm font-bold flex flex-col gap-2">
            {label}
            <input type="time" required value={hours[key]} onChange={(event) => setHours({ ...hours, [key]: event.target.value })}
              className="border-2 border-[#111118] rounded-lg p-3 bg-white" />
          </label>
        ))}
      </fieldset>
      <button disabled={busy} className="btn-brand mt-4" type="submit">{busy ? "Сохраняем…" : "Сохранить график"}</button>
      <p role="status" aria-live="polite" className="text-sm mt-3">{message}</p>
    </form>
  );
}
