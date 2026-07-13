"use client";

import { useState } from "react";

export default function RefLinkCard({
  refLink,
  refCode,
  referralsCount,
}: {
  refLink: string;
  refCode: string;
  referralsCount: number;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Встретимся в Proекторе",
          text: `Регистрируйся по моей ссылке в тайм-кафе Proектор. Мой код: ${refCode}`,
          url: refLink,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      prompt("Скопируйте ссылку:", refLink);
    }
  }

  return (
    <div className="card p-6 mb-6">
      <h2 className="font-extrabold text-lg text-brand-dark mb-1">
        Приведи друга — получай 3% с его покупок
      </h2>
      <p className="text-sm text-[#3c3c6e] mb-4">
        Друзей приглашено: <b>{referralsCount}</b> · Твой промокод: <b>{refCode}</b>
      </p>
      <div className="flex gap-2">
        <input className="input text-sm" readOnly value={refLink} onFocus={(e) => e.target.select()} />
        <button className="btn-brand !px-4 shrink-0" onClick={share}>
          {copied ? "Ссылка скопирована" : "Поделиться"}
        </button>
      </div>
    </div>
  );
}
