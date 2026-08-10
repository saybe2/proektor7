"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client-api";
import { formatDateTime, telHref } from "@/lib/format";

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
  const [error, setError] = useState("");

  async function markRead(id: string) {
    setLoadingId(id);
    setError("");
    try {
      const data = await postJson("/api/owner/feedback-read", { id });
      if (!data.ok) {
        setError(data.error);
        return;
      }
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
                  <a className="font-bold text-brand" href={telHref(item.phone)}>
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
                {formatDateTime(item.createdAt)}
              </span>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{item.message}</p>
          {!item.isRead && (
            <button
              className="btn-outline mt-4 text-sm"
              disabled={loadingId === item.id}
              onClick={() => void markRead(item.id)}
            >
              {loadingId === item.id ? "Сохраняем..." : "Прочитано"}
            </button>
          )}
        </div>
      ))}
      {error && <p className="text-sm font-bold text-red-500">{error}</p>}
    </div>
  );
}
