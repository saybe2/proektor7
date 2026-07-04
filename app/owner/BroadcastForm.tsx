"use client";

import { useState } from "react";

export default function BroadcastForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/owner/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
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
    <div className="card p-6">
      <h2 className="font-extrabold text-lg text-brand-dark mb-4">
        Пуш-рассылка всем клиентам
      </h2>
      <div className="space-y-3">
        <div>
          <label className="label">Заголовок</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Акция в Proекторе!"
          />
        </div>
        <div>
          <label className="label">Текст</label>
          <textarea
            className="input min-h-24"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="В эти выходные скидка 20% на все комнаты..."
          />
        </div>
        {result && <p className="text-sm font-bold text-brand">{result}</p>}
        <button
          className="btn-brand"
          disabled={loading || !title || !body}
          onClick={send}
        >
          {loading ? "Отправляем..." : "Отправить всем"}
        </button>
      </div>
    </div>
  );
}
