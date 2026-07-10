import { db } from "./db";
import { randomInt } from "node:crypto";

const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function generateCode(): string {
  return String(randomInt(1000, 10000));
}

export type SendOtpResult =
  | { ok: true; channel: "mock" | "flashcall" }
  | { ok: false; error: string };

/** Отправка кода подтверждения на телефон */
export async function sendOtp(phone: string): Promise<SendOtpResult> {
  // антиспам: не чаще раза в минуту
  const recent = await db.otpCode.findFirst({
    where: {
      phone,
      createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000) },
    },
  });
  if (recent) {
    return { ok: false, error: "Код уже отправлен. Подождите минуту." };
  }

  const provider = process.env.OTP_PROVIDER || (process.env.NODE_ENV === "production" ? "" : "mock");

  if (provider !== "smsru" && provider !== "mock") {
    return { ok: false, error: "Сервис подтверждения номера не настроен" };
  }

  if (provider === "smsru") {
    // Flash call через sms.ru: клиенту звонят, код = последние 4 цифры номера
    const apiId = process.env.SMSRU_API_ID;
    if (!apiId) return { ok: false, error: "SMSRU_API_ID не настроен" };

    const res = await fetch(
      `https://sms.ru/code/call?phone=${phone}&ip=-1&api_id=${apiId}`
    );
    const data = (await res.json()) as { status: string; code?: string };
    if (data.status !== "OK" || !data.code) {
      return { ok: false, error: "Не удалось выполнить звонок. Попробуйте позже." };
    }
    await saveCode(phone, data.code);
    return { ok: true, channel: "flashcall" };
  }

  // mock: код в консоль сервера
  const code = generateCode();
  await saveCode(phone, code);
  console.log(`\n  [OTP] Код для ${phone}: ${code}\n`);
  return { ok: true, channel: "mock" };
}

async function saveCode(phone: string, code: string) {
  await db.otpCode.deleteMany({ where: { phone } });
  await db.otpCode.create({
    data: {
      phone,
      code,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });
}

export type VerifyOtpResult = { ok: true } | { ok: false; error: string };

/** Проверка кода */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  const record = await db.otpCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, error: "Код не найден. Запросите новый." };
  if (record.expiresAt < new Date()) {
    await db.otpCode.delete({ where: { id: record.id } });
    return { ok: false, error: "Код истёк. Запросите новый." };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await db.otpCode.delete({ where: { id: record.id } });
    return { ok: false, error: "Слишком много попыток. Запросите новый код." };
  }

  if (record.code !== code.trim()) {
    await db.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Неверный код" };
  }

  await db.otpCode.delete({ where: { id: record.id } });
  return { ok: true };
}
