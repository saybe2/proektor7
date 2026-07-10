"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "phone" | "code" | "profile";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const refFromUrl = params.get("ref") || "";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [refCode, setRefCode] = useState(refFromUrl);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<string>("");

  async function sendCode() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Ошибка отправки кода");
        return;
      }
      setChannel(data.channel);
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  async function verify(extra?: { name?: string; birthDate?: string; refCode?: string }) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, ...extra }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Ошибка");
        return false;
      }
      const target =
        data.role === "OWNER" ? "/owner" : data.role === "ADMIN" ? "/admin" : "/cabinet";
      router.push(target);
      router.refresh();
      return true;
    } finally {
      setLoading(false);
    }
  }

  // Шаг 1: телефон
  if (step === "phone") {
    return (
      <div className="card p-6 space-y-4">
        <div>
          <label className="label">Номер телефона</label>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            placeholder="+7 900 000-00-00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && phone && sendCode()}
            autoFocus
          />
        </div>
        {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
        <button className="btn-brand w-full" onClick={sendCode} disabled={loading || !phone}>
          {loading ? "Отправляем..." : "Получить код"}
        </button>
        <p className="text-xs text-[#3c3c6e] text-center">
          Мы позвоним вам — вводить нужно последние 4 цифры входящего номера.
        </p>
      </div>
    );
  }

  // Шаг 2: код
  if (step === "code") {
    return (
      <div className="card p-6 space-y-4">
        <div>
          <label className="label">
            {channel === "flashcall"
              ? "Последние 4 цифры входящего номера"
              : "Код подтверждения"}
          </label>
          <input
            className="input text-center text-2xl tracking-[0.5em] font-bold"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
        </div>
        {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
        <button
          className="btn-brand w-full"
          disabled={loading || code.length < 4}
          onClick={async () => {
            // сначала пробуем как существующий пользователь;
            // сервер сам создаст аккаунт, но нам нужны имя/ДР для новых —
            // поэтому идём через шаг профиля только если пользователь новый.
            // Проверяем через отдельный запрос: register=false
            setError("");
            setLoading(true);
            try {
              const res = await fetch("/api/auth/check-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
              });
              const data = await res.json();
              setLoading(false);
              if (data.exists) {
                await verify();
              } else {
                setStep("profile");
              }
            } catch {
              setLoading(false);
              setError("Ошибка сети");
            }
          }}
        >
          {loading ? "Проверяем..." : "Продолжить"}
        </button>
        <button
          className="text-sm text-brand font-semibold w-full"
          onClick={() => setStep("phone")}
        >
          ← Изменить номер
        </button>
      </div>
    );
  }

  // Шаг 3: профиль нового пользователя
  return (
    <div className="card p-6 space-y-4">
      <p className="font-bold text-brand-dark">Почти готово! Расскажите о себе:</p>
      <div>
        <label className="label">Имя</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          autoFocus
        />
      </div>
      <div>
          <label className="label">Дата рождения (для скидки на праздник)</label>
        <input
          className="input"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Промокод друга (если есть)</label>
        <input
          className="input uppercase"
          value={refCode}
          onChange={(e) => setRefCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={8}
        />
      </div>
      {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
      <button
        className="btn-brand w-full"
        disabled={loading}
        onClick={() => verify({ name, birthDate, refCode: refCode || undefined })}
      >
        {loading ? "Создаём аккаунт..." : "Зарегистрироваться (+150 бонусов)"}
      </button>
    </div>
  );
}
