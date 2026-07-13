"use client";

import { useState } from "react";

type Client = {
  id: string;
  phone: string;
  name: string | null;
  bonusBalance: number;
  createdAt: string;
};

export default function AdminPanel({ isOwner }: { isOwner: boolean }) {
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [amount, setAmount] = useState("");
  const [bonuses, setBonuses] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    setMessage(null);
    setSelected(null);
    const res = await fetch(`/api/admin/clients?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.ok) setClients(data.clients);
    else setMessage({ ok: false, text: data.error || "Ошибка поиска" });
  }

  async function submitPurchase() {
    if (!selected) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.id,
          amount: Number(amount),
          bonusesToSpend: Number(bonuses) || 0,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMessage({ ok: false, text: data.error });
        return;
      }
      setMessage({
        ok: true,
        text: `Чек проведён! Кэшбэк клиенту: +${data.cashback} бонусов${
          data.referralBonus ? `, рефереру: +${data.referralBonus}` : ""
        }`,
      });
      setAmount("");
      setBonuses("");
      // обновляем баланс в списке
      search();
    } finally {
      setLoading(false);
    }
  }

  const amountNum = Number(amount) || 0;
  const maxRedeem = amountNum >= 500 ? Math.floor(amountNum / 2) : 0;

  return (
    <div className="space-y-6">
      {/* Поиск клиента */}
      <div className="card p-6">
        <label className="label">Поиск клиента (телефон или имя)</label>
        <div className="flex gap-2">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="79001234567 или Иван"
          />
          <button className="btn-brand !px-5 shrink-0" onClick={search}>
            Найти
          </button>
        </div>

        {clients.length > 0 && (
          <div className="mt-4 divide-y divide-[#eef0fa]">
            {clients.map((c) => (
              <button
                key={c.id}
                className={`w-full text-left py-3 px-2 flex items-center justify-between hover:bg-brand-bg rounded-lg ${
                  selected?.id === c.id ? "bg-brand-bg" : ""
                }`}
                onClick={() => setSelected(c)}
              >
                <div>
                  <div className="font-bold text-brand-dark">{c.name || "Без имени"}</div>
                  <div className="text-sm text-[#3c3c6e]">{isOwner ? `+${c.phone}` : `Номер заканчивается на ${c.phone}`}</div>
                </div>
                <div className="font-extrabold text-brand">{c.bonusBalance} б.</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Проведение чека */}
      {selected && (
        <div className="card p-6">
          <h2 className="font-extrabold text-lg text-brand-dark mb-1">
            Чек для: {selected.name || "клиент"} ({isOwner ? `+${selected.phone}` : `••• ${selected.phone}`})
          </h2>
          <p className="text-sm text-[#3c3c6e] mb-4">
            На счету: <b>{selected.bonusBalance} бонусов</b>
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Сумма чека, ₽</label>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Списать бонусов</label>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                min={0}
                value={bonuses}
                onChange={(e) => setBonuses(e.target.value)}
                disabled={amountNum < 500}
              />
              <div className="text-xs text-[#3c3c6e] mt-1">
                {amountNum >= 500
                  ? `Макс: ${Math.min(maxRedeem, selected.bonusBalance)} (50% чека)`
                  : "Списание доступно при чеке от 500 ₽"}
              </div>
            </div>
          </div>

          {message && (
            <p className={`mt-4 text-sm font-bold ${message.ok ? "text-green-600" : "text-red-500"}`}>
              {message.text}
            </p>
          )}

          <button
            className="btn-brand w-full mt-4"
            disabled={loading || amountNum <= 0}
            onClick={submitPurchase}
          >
            {loading ? "Проводим..." : `Провести чек на ${amountNum || 0} ₽`}
          </button>
        </div>
      )}

      {/* Ручная корректировка бонусов */}
      {selected && isOwner && (
        <AdjustBonus
          client={selected}
          onDone={() => search()}
        />
      )}
    </div>
  );
}

function AdjustBonus({
  client,
  onDone,
}: {
  client: Client;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/adjust-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: client.id,
          amount: Number(amount),
          comment: comment || undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg({ ok: false, text: data.error });
        return;
      }
      setMsg({ ok: true, text: `Готово! Новый баланс: ${data.newBalance}` });
      setAmount("");
      setComment("");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-extrabold text-lg text-brand-dark mb-1">
        Корректировка бонусов
      </h2>
      <p className="text-sm text-[#3c3c6e] mb-4">
        Начислить (например, скидка на ДР) или списать вручную. Отрицательное число — списание.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Бонусы (+/-)</label>
          <input
            className="input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Например: 500 или -200"
          />
        </div>
        <div>
          <label className="label">Комментарий</label>
          <input
            className="input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Подарок на день рождения"
          />
        </div>
      </div>
      {msg && (
        <p className={`mt-4 text-sm font-bold ${msg.ok ? "text-green-600" : "text-red-500"}`}>
          {msg.text}
        </p>
      )}
      <button
        className="btn-outline w-full mt-4"
        disabled={busy || !Number(amount)}
        onClick={submit}
      >
        {busy ? "Применяем..." : "Применить корректировку"}
      </button>
    </div>
  );
}
