"use client";

import { useState } from "react";

export default function PushOneForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/owner/push-one", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, body }),
      });
      const data = await res.json();
      setResult(data.ok ? `Отправлено на ${data.sent} устройств` : data.error || "Ошибка");
      if (data.ok) {
        setTitle("");
        setBody("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 border-t-2 border-[#111118] pt-5">
      <h3 className="font-black mb-3">Уведомление клиенту</h3>
      <div className="space-y-3">
        <div>
          <label className="label">Заголовок</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Proектор"
          />
        </div>
        <div>
          <label className="label">Текст</label>
          <input
            className="input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Текст уведомления"
          />
        </div>
        {result && <p className="text-sm font-bold text-brand">{result}</p>}
        <button
          className="btn-brand"
          disabled={loading || !title || !body}
          onClick={send}
        >
          {loading ? "Отправляем..." : "Отправить уведомление"}
        </button>
      </div>
    </div>
  );
}
