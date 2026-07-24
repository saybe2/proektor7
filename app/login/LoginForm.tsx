"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Step = "phone" | "call" | "profile";
type Channel = "callcheck" | "mock" | "";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const refFromUrl = params.get("ref") || "";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [refCode, setRefCode] = useState(refFromUrl);
  const [channel, setChannel] = useState<Channel>("");
  const [attemptToken, setAttemptToken] = useState("");
  const [callPhone, setCallPhone] = useState("");
  const [callPhonePretty, setCallPhonePretty] = useState("");
  const [mockCode, setMockCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const completingRef = useRef(false);
  const checkingRef = useRef(false);

  const finishLogin = useCallback(async (extra?: {
    name?: string;
    birthDate?: string;
    refCode?: string;
  }) => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          attemptToken,
          privacyAccepted,
          mockCode: channel === "mock" ? mockCode : undefined,
          ...extra,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!data?.ok) {
        setError(data?.error || "Не удалось войти");
        completingRef.current = false;
        return false;
      }
      const target =
        data.role === "OWNER" ? "/owner" : data.role === "ADMIN" ? "/admin" : "/cabinet";
      router.push(target);
      router.refresh();
      return true;
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      completingRef.current = false;
      return false;
    } finally {
      setLoading(false);
    }
  }, [attemptToken, channel, mockCode, phone, privacyAccepted, router]);

  const continueAfterVerification = useCallback(async (profileRequired: boolean) => {
    if (completingRef.current) return;
    completingRef.current = true;
    setLoading(true);
    setError("");
    if (profileRequired) {
      setStep("profile");
      setLoading(false);
      return;
    }
    await finishLogin();
  }, [finishLogin]);

  const checkCall = useCallback(async (manual = false) => {
    if (!attemptToken || completingRef.current || checkingRef.current) return;
    checkingRef.current = true;
    if (manual) setLoading(true);
    try {
      const response = await fetch("/api/auth/call-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          attemptToken,
          mockCode: channel === "mock" ? mockCode : undefined,
        }),
      });
      const data = await response.json();
      if (data.ok && data.verified) {
        await continueAfterVerification(Boolean(data.profileRequired));
      } else if (!data.ok) {
        setError(data.error || "Не удалось проверить звонок");
      }
    } catch {
      if (manual) setError("Не удалось проверить звонок. Попробуйте ещё раз.");
    } finally {
      checkingRef.current = false;
      if (manual && !completingRef.current) setLoading(false);
    }
  }, [attemptToken, channel, continueAfterVerification, mockCode, phone]);

  useEffect(() => {
    if (step !== "call" || channel !== "callcheck") return;
    const timer = window.setInterval(() => void checkCall(), 2000);
    return () => window.clearInterval(timer);
  }, [channel, checkCall, step]);

  async function startCall() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, privacyAccepted }),
      });
      const data = await response.json();
      if (!data.ok) {
        setError(data.error || "Не удалось начать проверку");
        return;
      }
      setChannel(data.channel);
      setAttemptToken(data.attemptToken);
      setCallPhone(data.callPhone);
      setCallPhonePretty(data.callPhonePretty);
      setStep("call");
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    completingRef.current = false;
    setStep("phone");
    setChannel("");
    setAttemptToken("");
    setCallPhone("");
    setCallPhonePretty("");
    setMockCode("");
    setError("");
  }

  if (step === "phone") {
    return (
      <div className="card p-6 space-y-4">
        <div>
          <label className="label" htmlFor="login-phone">Номер телефона</label>
          <input
            id="login-phone"
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 900 000-00-00"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && phone && void startCall()}
            autoFocus
          />
        </div>
        {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
        <label className="flex items-start gap-3 text-xs text-[#3c3c6e] leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-[#2020c7]"
            checked={privacyAccepted}
            onChange={(event) => setPrivacyAccepted(event.target.checked)}
          />
          <span>
            Я ознакомился с <Link href="/privacy" target="_blank" className="text-brand font-bold underline">Политикой обработки персональных данных</Link> и даю согласие на обработку данных для регистрации, подтверждения номера и работы бонусной программы.
          </span>
        </label>
        <button className="btn-brand w-full" onClick={startCall} disabled={loading || !phone || !privacyAccepted}>
          {loading ? "Подготавливаем звонок..." : "Продолжить"}
        </button>
        <p className="text-xs text-[#3c3c6e] text-center">
          Для подтверждения нужно будет бесплатно позвонить на специальный номер.
        </p>
      </div>
    );
  }

  if (step === "call") {
    return (
      <div className="card p-6 space-y-5 text-center">
        {channel === "callcheck" ? (
          <>
            <div>
              <div className="eyebrow text-brand mb-3">Подтверждение номера</div>
              <h2 className="h-display text-xl text-brand-dark">Позвоните с указанного телефона</h2>
            </div>
            <p className="text-sm text-[#3c3c6e]">
              Нажмите кнопку и дождитесь автоматического сброса. Звонок бесплатный, отвечать никто не будет.
            </p>
            <a className="btn-brand booking-shimmer w-full text-lg" href={`tel:${callPhone}`}>
              Позвонить {callPhonePretty}
            </a>
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-brand-dark" role="status">
              <span className="size-2.5 bg-[#ff5c35] rounded-full animate-pulse" />
              Ожидаем звонок до 5 минут
            </div>
            <button className="btn-outline w-full" onClick={() => void checkCall(true)} disabled={loading}>
              {loading ? "Проверяем..." : "Я позвонил — проверить"}
            </button>
          </>
        ) : (
          <>
            <div>
              <div className="eyebrow text-brand mb-3">Тестовый режим</div>
              <h2 className="h-display text-xl text-brand-dark">Введите код из логов сервера</h2>
            </div>
            <input
              className="input text-center text-2xl tracking-[0.5em] font-bold"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={mockCode}
              onChange={(event) => setMockCode(event.target.value.replace(/\D/g, ""))}
              autoFocus
            />
            <button className="btn-brand w-full" onClick={() => void checkCall(true)} disabled={loading || mockCode.length !== 4}>
              {loading ? "Проверяем..." : "Подтвердить"}
            </button>
          </>
        )}
        {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
        <button className="text-sm text-brand font-semibold w-full" onClick={restart}>
          Изменить номер
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <p className="font-bold text-brand-dark">Номер подтверждён. Расскажите о себе:</p>
      <div>
        <label className="label" htmlFor="register-name">Имя</label>
        <input
          id="register-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Как к вам обращаться"
          maxLength={60}
          autoComplete="name"
          autoFocus
        />
      </div>
      <div>
        <label className="label" htmlFor="register-birthday">Дата рождения (для праздничной скидки)</label>
        <input id="register-birthday" className="input" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="register-referral">Промокод друга (если есть)</label>
        <input
          id="register-referral"
          className="input uppercase"
          value={refCode}
          onChange={(event) => setRefCode(event.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={8}
        />
      </div>
      {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
      <button
        className="btn-brand w-full"
        disabled={loading}
        onClick={() => void finishLogin({ name, birthDate, refCode: refCode || undefined })}
      >
        {loading ? "Создаём аккаунт..." : "Зарегистрироваться (+150 бонусов)"}
      </button>
    </div>
  );
}
