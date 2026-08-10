"use client";

import { useState } from "react";
import { postJson } from "@/lib/client-api";

export default function FeedbackForm({ initialName, initialPhone }: { initialName: string; initialPhone: string }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setResult("");
    setError("");
    try {
      const data = await postJson("/api/feedback", {
        name: name || undefined,
        phone: phone || undefined,
        message,
      });
      if (data.ok) {
        setResult("Сообщение отправлено. Директор получит уведомление.");
        setMessage("");
      } else {
        setError(data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="space-y-3">
        <div>
          <label className="label">Имя</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
          />
        </div>
        <div>
          <label className="label">Телефон</label>
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 9XX XXX-XX-XX"
          />
          <p className="text-xs text-[#66656f] mt-1">чтобы мы могли ответить</p>
        </div>
        <div>
          <label className="label">Сообщение</label>
          <textarea
            className="input min-h-32"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Расскажите, что случилось или что можно улучшить..."
            maxLength={1000}
          />
        </div>
        {result && <p className="text-sm font-bold text-brand">{result}</p>}
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
        <button
          className="btn-brand w-full"
          disabled={loading || message.trim().length < 10}
          onClick={() => void send()}
        >
          {loading ? "Отправляем..." : "Отправить директору"}
        </button>
      </div>
    </div>
  );
}
