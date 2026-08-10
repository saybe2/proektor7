"use client";

import { useState } from "react";
import { getJson, postJson } from "@/lib/client-api";
import { AUTO_CONFIRM_HOURS, BONUS } from "@/lib/config";

type Client = {
  id: string;
  phone: string;
  name: string | null;
  bonusBalance: number;
  isGuest: boolean;
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
  const [searching, setSearching] = useState(false);

  async function search(keepMessage = false) {
    if (searching) return;
    setSearching(true);
    if (!keepMessage) {
      setMessage(null);
      setSelected(null);
    }
    try {
      const data = await getJson<{ clients: Client[] }>(
        `/api/admin/clients?q=${encodeURIComponent(query)}`
      );
      if (data.ok) setClients(data.clients);
      else setMessage({ ok: false, text: data.error });
    } finally {
      setSearching(false);
    }
  }

  async function submitPurchase() {
    if (!selected) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await postJson<{ cashback: number; referralBonus: number }>(
        "/api/admin/purchase",
        {
          userId: selected.id,
          amount: Number(amount),
          bonusesToSpend: Number(bonuses) || 0,
        }
      );
      if (!data.ok) {
        setMessage({ ok: false, text: data.error });
        return;
      }
      setMessage({
        ok: true,
        text: `Чек отправлен на подтверждение владельцу. Клиент получит +${data.cashback} бонусов${
          data.referralBonus ? `, рефереру +${data.referralBonus}` : ""
        } после подтверждения или автоматически через ${AUTO_CONFIRM_HOURS} часов`,
      });
      setAmount("");
      setBonuses("");
      // обновляем баланс в списке, не затирая сообщение об успехе
      await search(true);
    } finally {
      setLoading(false);
    }
  }

  const amountNum = Number(amount) || 0;
  // гость не подтверждал номер: бонусы копятся, но списать их нельзя
  const canRedeem = Boolean(selected && !selected.isGuest);
  const maxRedeem =
    canRedeem && amountNum >= BONUS.MIN_CHECK_FOR_REDEEM
      ? Math.floor((amountNum * BONUS.MAX_REDEEM_PERCENT) / 100)
      : 0;

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
            onKeyDown={(e) => e.key === "Enter" && void search()}
            placeholder="79001234567 или Иван"
          />
          <button
            className="btn-brand !px-5 shrink-0"
            onClick={() => void search()}
            disabled={searching}
          >
            {searching ? "Ищем..." : "Найти"}
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
                  {c.isGuest && (
                    <div className="text-xs text-[#3c3c6e]">Не зарегистрирован — списание недоступно</div>
                  )}
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
          <p className="text-xs text-[#3c3c6e] mb-4">
            Бонусы применяются после подтверждения владельцем (автоматически через {AUTO_CONFIRM_HOURS} ч).
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
                disabled={!canRedeem || amountNum < BONUS.MIN_CHECK_FOR_REDEEM}
              />
              <div className="text-xs text-[#3c3c6e] mt-1">
                {!canRedeem
                  ? "Гость не зарегистрирован на сайте — бонусы копятся, списать их можно после регистрации"
                  : amountNum >= BONUS.MIN_CHECK_FOR_REDEEM
                    ? `Макс: ${Math.min(maxRedeem, selected.bonusBalance)} (${BONUS.MAX_REDEEM_PERCENT}% чека)`
                    : `Списание доступно при чеке от ${BONUS.MIN_CHECK_FOR_REDEEM} ₽`}
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
            onClick={() => void submitPurchase()}
          >
            {loading ? "Проводим..." : `Провести чек на ${amountNum || 0} ₽`}
          </button>
        </div>
      )}

      {/* Ручная корректировка бонусов */}
      {selected && isOwner && (
        <AdjustBonus
          client={selected}
          onDone={() => void search(true)}
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
      const data = await postJson<{ newBalance: number }>("/api/admin/adjust-bonus", {
        userId: client.id,
        amount: Number(amount),
        comment: comment || undefined,
      });
      if (!data.ok) {
        setMsg({ ok: false, text: data.error });
        return;
      }
      setMsg({ ok: true, text: `Готово. Новый баланс: ${data.newBalance}` });
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
        onClick={() => void submit()}
      >
        {busy ? "Применяем..." : "Применить корректировку"}
      </button>
    </div>
  );
}
