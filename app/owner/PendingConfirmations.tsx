"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client-api";
import { BONUS } from "@/lib/config";
import { formatDateTime } from "@/lib/format";

type PendingPurchase = {
  id: string;
  amount: number;
  bonusesSpent: number;
  createdAt: string;
  clientName: string;
  clientPhone: string;
  cashback: number;
  referralBonus: number;
};

type PendingWelcome = {
  userId: string;
  name: string;
  phone: string;
  createdAt: string;
};

export default function PendingConfirmations({
  pendingPurchases,
  pendingWelcomes,
}: {
  pendingPurchases: PendingPurchase[];
  pendingWelcomes: PendingWelcome[];
}) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(endpoint: string, payload: Record<string, string>, key: string) {
    setBusyKey(key);
    setError(null);
    try {
      const data = await postJson(endpoint, payload);
      if (!data.ok) {
        setError(data.error);
        return;
      }
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="card p-6 mb-6">
      <h2 className="font-extrabold text-lg text-brand-dark mb-4">Ожидают подтверждения</h2>

      <div className="divide-y divide-[#eef0fa]">
        {pendingPurchases.map((p) => (
          <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-sm text-brand-dark">
                {p.clientName} (+{p.clientPhone})
              </div>
              <div className="text-xs text-[#3c3c6e]">
                чек {p.amount} ₽
                {p.bonusesSpent > 0 ? `, списание ${p.bonusesSpent} б.` : ""}
                {p.cashback > 0 ? `, кэшбэк +${p.cashback} б.` : ""}
                {p.referralBonus > 0 ? `, рефереру +${p.referralBonus} б.` : ""}
              </div>
              <div className="text-xs text-[#9aa0c0]">
                {formatDateTime(p.createdAt)}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className="btn-brand !py-2 !px-4 text-sm"
                disabled={busyKey !== null}
                onClick={() =>
                  decide("/api/owner/purchase-decision", { purchaseId: p.id, action: "confirm" }, `p-${p.id}-c`)
                }
              >
                {busyKey === `p-${p.id}-c` ? "..." : "Подтвердить"}
              </button>
              <button
                className="btn-outline !py-2 !px-4 text-sm"
                disabled={busyKey !== null}
                onClick={() =>
                  decide("/api/owner/purchase-decision", { purchaseId: p.id, action: "reject" }, `p-${p.id}-r`)
                }
              >
                {busyKey === `p-${p.id}-r` ? "..." : "Отклонить"}
              </button>
            </div>
          </div>
        ))}

        {pendingWelcomes.map((w) => (
          <div key={w.userId} className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-sm text-brand-dark">
                Новая регистрация: {w.name} (+{w.phone})
              </div>
              <div className="text-xs text-[#3c3c6e]">{BONUS.WELCOME} приветственных бонусов</div>
              <div className="text-xs text-[#9aa0c0]">
                {formatDateTime(w.createdAt)}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className="btn-brand !py-2 !px-4 text-sm"
                disabled={busyKey !== null}
                onClick={() =>
                  decide("/api/owner/welcome-decision", { userId: w.userId, action: "confirm" }, `w-${w.userId}-c`)
                }
              >
                {busyKey === `w-${w.userId}-c` ? "..." : "Подтвердить"}
              </button>
              <button
                className="btn-outline !py-2 !px-4 text-sm"
                disabled={busyKey !== null}
                onClick={() =>
                  decide("/api/owner/welcome-decision", { userId: w.userId, action: "reject" }, `w-${w.userId}-r`)
                }
              >
                {busyKey === `w-${w.userId}-r` ? "..." : "Отклонить"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm font-bold text-red-500">{error}</p>}
    </div>
  );
}
