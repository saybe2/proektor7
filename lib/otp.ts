import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { Prisma } from "@prisma/client";

const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const SMSRU_API_BASE = "https://sms.ru/callcheck";

type SmsRuStartResponse = {
  status?: string;
  status_code?: number;
  status_text?: string;
  check_id?: string;
  call_phone?: string;
  call_phone_pretty?: string;
};

type SmsRuStatusResponse = {
  status?: string;
  status_code?: number;
  status_text?: string;
  check_status?: string | number;
  check_status_text?: string;
};

export type StartPhoneVerificationResult =
  | {
      ok: true;
      channel: "callcheck" | "mock";
      attemptToken: string;
      callPhone: string;
      callPhonePretty: string;
    }
  | { ok: false; error: string };

export type CheckPhoneVerificationResult =
  | { ok: true; verified: boolean }
  | { ok: false; error: string; expired?: boolean };

export async function startPhoneVerification(
  phone: string
): Promise<StartPhoneVerificationResult> {
  const provider =
    process.env.OTP_PROVIDER || (process.env.NODE_ENV === "production" ? "" : "mock");
  const attemptToken = randomBytes(24).toString("hex");
  const now = new Date();
  await db.otpCode.deleteMany({
    where: {
      phone,
      OR: [
        { expiresAt: { lte: now } },
        { createdAt: { lte: new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000) } },
      ],
    },
  });
  let attemptId: string;
  try {
    const attempt = await db.otpCode.create({
      data: {
        phone,
        code: attemptToken,
        callId: "pending",
        expiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });
    attemptId = attempt.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "Проверка уже запущена. Подождите минуту." };
    }
    throw error;
  }

  if (provider === "mock") {
    const mockCode = String(randomInt(1000, 10000));
    await setProviderAttempt(attemptId, attemptToken, `mock:${mockCode}`);
    console.log(`\n  [AUTH] Тестовый код для ${phone}: ${mockCode}\n`);
    return {
      ok: true,
      channel: "mock",
      attemptToken,
      callPhone: "",
      callPhonePretty: "",
    };
  }

  if (provider !== "smsru") {
    await removeReservedAttempt(attemptId, attemptToken);
    return { ok: false, error: "Сервис подтверждения номера не настроен" };
  }

  const apiId = process.env.SMSRU_API_ID;
  if (!apiId) {
    await removeReservedAttempt(attemptId, attemptToken);
    return { ok: false, error: "SMSRU_API_ID не настроен" };
  }

  const params = new URLSearchParams({ api_id: apiId, phone, json: "1" });
  const response = await fetch(`${SMSRU_API_BASE}/add?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!response?.ok) {
    await removeReservedAttempt(attemptId, attemptToken);
    return { ok: false, error: "Сервис звонков временно недоступен" };
  }

  const data = (await response.json().catch(() => null)) as SmsRuStartResponse | null;
  if (
    !data ||
    data.status !== "OK" ||
    data.status_code !== 100 ||
    !data.check_id ||
    !data.call_phone
  ) {
    await removeReservedAttempt(attemptId, attemptToken);
    return {
      ok: false,
      error: data?.status_text || "Не удалось подготовить звонок. Попробуйте позже.",
    };
  }

  await setProviderAttempt(attemptId, attemptToken, `callcheck:${data.check_id}`);
  return {
    ok: true,
    channel: "callcheck",
    attemptToken,
    callPhone: normalizeCallPhone(data.call_phone),
    callPhonePretty: data.call_phone_pretty || formatCallPhone(data.call_phone),
  };
}

export async function checkPhoneVerification(
  phone: string,
  attemptToken: string,
  mockCode?: string
): Promise<CheckPhoneVerificationResult> {
  const attempt = await db.otpCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (!attempt || !safeEqual(attemptToken, attempt.code)) {
    return { ok: false, error: "Проверка не найдена. Начните заново." };
  }
  if (attempt.expiresAt < new Date()) {
    await db.otpCode.delete({ where: { id: attempt.id } });
    return { ok: false, error: "Время ожидания звонка истекло.", expired: true };
  }
  if (attempt.verifiedAt) return { ok: true, verified: true };

  const [kind, value] = (attempt.callId || "").split(":", 2);
  if (kind === "mock") {
    if (!mockCode) return { ok: true, verified: false };
    if (mockCode.trim() !== value) return { ok: false, error: "Неверный тестовый код" };
    await markVerified(attempt.id, attemptToken);
    return { ok: true, verified: true };
  }
  if (kind !== "callcheck" || !value) {
    return { ok: false, error: "Некорректная попытка проверки" };
  }

  const apiId = process.env.SMSRU_API_ID;
  if (!apiId) return { ok: false, error: "SMSRU_API_ID не настроен" };
  const params = new URLSearchParams({ api_id: apiId, check_id: value, json: "1" });
  const response = await fetch(`${SMSRU_API_BASE}/status?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!response?.ok) return { ok: false, error: "Не удалось проверить звонок" };

  const data = (await response.json().catch(() => null)) as SmsRuStatusResponse | null;
  const status = String(data?.check_status || "");
  if (data?.status !== "OK" || data.status_code !== 100) {
    return { ok: false, error: data?.status_text || "Ошибка проверки звонка" };
  }
  if (status === "401") {
    await markVerified(attempt.id, attemptToken);
    return { ok: true, verified: true };
  }
  if (status === "400") return { ok: true, verified: false };
  if (status === "402") {
    await db.otpCode.delete({ where: { id: attempt.id } });
    return { ok: false, error: "Время ожидания звонка истекло.", expired: true };
  }
  return { ok: false, error: data?.check_status_text || data?.status_text || "Ошибка проверки звонка" };
}

async function setProviderAttempt(id: string, attemptToken: string, callId: string) {
  await db.otpCode.updateMany({ where: { id, code: attemptToken }, data: { callId } });
}

async function removeReservedAttempt(id: string, attemptToken: string) {
  await db.otpCode.deleteMany({ where: { id, code: attemptToken } });
}

async function markVerified(id: string, attemptToken: string) {
  await db.otpCode.updateMany({
    where: { id, code: attemptToken },
    data: {
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function normalizeCallPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("7") ? `+${digits}` : phone;
}

function formatCallPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 11 || !digits.startsWith("7")) return phone;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
}
