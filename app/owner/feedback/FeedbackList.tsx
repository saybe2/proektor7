"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FeedbackItem = {
  id: string;
  createdAt: string;
  name: string | null;
  phone: string | null;
  message: string;
  isRead: boolean;
};

export default function FeedbackList({ items }: { items: FeedbackItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function markRead(id: string) {
    setLoadingId(id);
    try {
      await fetch("/api/owner/feedback-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-[#3c3c6e] text-sm">Сообщений пока нет.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="card p-6">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div className="text-sm">
              <b>{item.name || "Анонимно"}</b>
              {item.phone && (
                <>
                  {" · "}
                  <a className="font-bold text-brand" href={`tel:${item.phone.replace(/[^+\d]/g, "")}`}>
                    {item.phone}
                  </a>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!item.isRead && (
                <span className="bg-brand text-white text-xs font-black px-2 py-0.5">Новое</span>
              )}
              <span className="text-xs text-[#66656f]">
                {new Date(item.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{item.message}</p>
          {!item.isRead && (
            <button
              className="btn-outline mt-4 text-sm"
              disabled={loadingId === item.id}
              onClick={() => markRead(item.id)}
            >
              {loadingId === item.id ? "Сохраняем..." : "Прочитано"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
