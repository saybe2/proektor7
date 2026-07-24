import { db } from "./db";
import type { Prisma } from "@prisma/client";
import { BONUS } from "./config";
import { randomInt } from "node:crypto";

/** Генерация уникального реферального кода */
export function generateRefCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[randomInt(0, chars.length)];
  }
  return code;
}

/**
 * Регистрация пользователя: welcome-бонусы + привязка реферера
 */
export async function createUserWithWelcomeBonus(params: {
  phone: string;
  name?: string;
  birthDate?: Date;
  refCode?: string; // код пригласившего
  privacyAcceptedAt: Date;
  privacyVersion: string;
}, client: Prisma.TransactionClient | typeof db = db) {
  const referrer = params.refCode
    ? await client.user.findUnique({ where: { refCode: params.refCode } })
    : null;

  // гарантируем уникальность собственного кода
  let myCode = generateRefCode();
  while (await client.user.findUnique({ where: { refCode: myCode } })) {
    myCode = generateRefCode();
  }

  return client.user.create({
    data: {
      phone: params.phone,
      name: params.name,
      birthDate: params.birthDate,
      refCode: myCode,
      referredById: referrer?.id,
      privacyAcceptedAt: params.privacyAcceptedAt,
      privacyVersion: params.privacyVersion,
      bonusBalance: BONUS.WELCOME,
      bonusTransactions: {
        create: {
          amount: BONUS.WELCOME,
          type: "WELCOME",
          comment: "Приветственные бонусы за регистрацию",
        },
      },
    },
  });
}

export type PurchaseResult =
  | { ok: true; purchaseId: string; cashback: number; referralBonus: number }
  | { ok: false; error: string };

/**
 * Проведение покупки админом:
 * - проверка лимитов списания (50% чека, чек от 500₽)
 * - списание бонусов
 * - кэшбэк 1% клиенту
 * - 3% рефереру
 */
export async function recordPurchase(params: {
  userId: string;
  amount: number; // сумма чека, руб
  bonusesToSpend: number;
  adminId: string;
}): Promise<PurchaseResult> {
  const { userId, amount, bonusesToSpend, adminId } = params;

  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: "Некорректная сумма чека" };
  }
  if (!Number.isInteger(bonusesToSpend) || bonusesToSpend < 0) {
    return { ok: false, error: "Некорректная сумма бонусов" };
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Клиент не найден" };
  if (user.role !== "CLIENT") return { ok: false, error: "Операцию можно провести только для клиента" };

  if (bonusesToSpend > 0) {
    if (amount < BONUS.MIN_CHECK_FOR_REDEEM) {
      return {
        ok: false,
        error: `Бонусы можно списывать только при чеке от ${BONUS.MIN_CHECK_FOR_REDEEM} ₽`,
      };
    }
    const maxRedeem = Math.floor((amount * BONUS.MAX_REDEEM_PERCENT) / 100);
    if (bonusesToSpend > maxRedeem) {
      return {
        ok: false,
        error: `Бонусами можно оплатить не более ${BONUS.MAX_REDEEM_PERCENT}% чека (${maxRedeem} бонусов)`,
      };
    }
    if (bonusesToSpend > user.bonusBalance) {
      return {
        ok: false,
        error: `Недостаточно бонусов (на счету ${user.bonusBalance})`,
      };
    }
  }

  // деньгами оплачено:
  const paidWithMoney = amount - bonusesToSpend;
  const cashback = Math.floor((paidWithMoney * BONUS.CASHBACK_PERCENT) / 100);
  const referralBonus = user.referredById
    ? Math.floor((paidWithMoney * BONUS.REFERRAL_PERCENT) / 100)
    : 0;

  const result = await db.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        userId,
        amount,
        bonusesSpent: bonusesToSpend,
        adminId,
      },
    });

    // списание
    if (bonusesToSpend > 0) {
      await tx.bonusTransaction.create({
        data: {
          userId,
          amount: -bonusesToSpend,
          type: "REDEEM",
          purchaseId: purchase.id,
          comment: `Оплата бонусами (чек ${amount} ₽)`,
        },
      });
    }

    // кэшбэк 1%
    if (cashback > 0) {
      await tx.bonusTransaction.create({
        data: {
          userId,
          amount: cashback,
          type: "CASHBACK",
          purchaseId: purchase.id,
          comment: `Кэшбэк ${BONUS.CASHBACK_PERCENT}% с покупки`,
        },
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: { bonusBalance: { increment: cashback - bonusesToSpend } },
    });

    // 3% рефереру
    if (referralBonus > 0 && user.referredById) {
      await tx.bonusTransaction.create({
        data: {
          userId: user.referredById,
          amount: referralBonus,
          type: "REFERRAL",
          purchaseId: purchase.id,
          comment: `${BONUS.REFERRAL_PERCENT}% от покупки друга`,
        },
      });
      await tx.user.update({
        where: { id: user.referredById },
        data: { bonusBalance: { increment: referralBonus } },
      });
    }

    return purchase;
  });

  return { ok: true, purchaseId: result.id, cashback, referralBonus };
}
