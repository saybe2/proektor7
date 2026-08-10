import { db } from "./db";
import type { Prisma } from "@prisma/client";
import { AUTO_CONFIRM_HOURS, BONUS } from "./config";
import { sendPushToUser } from "./push";
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
      bonusBalance: 0,
      bonusTransactions: {
        create: {
          amount: BONUS.WELCOME,
          type: "WELCOME",
          status: "PENDING",
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
 * - чек и транзакции создаются в статусе PENDING
 * - балансы меняются только после подтверждения владельцем
 */
export async function recordPurchase(params: {
  userId: string;
  amount: number; // сумма чека, руб
  bonusesToSpend: number;
  adminId?: string;
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
    const pendingRedeem = await db.bonusTransaction.aggregate({
      where: { userId, type: "REDEEM", status: "PENDING" },
      _sum: { amount: true },
    });
    const available = user.bonusBalance - Math.abs(pendingRedeem._sum.amount || 0);
    if (bonusesToSpend > available) {
      return {
        ok: false,
        error: `Недостаточно бонусов (доступно ${available})`,
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
        status: "PENDING",
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
          status: "PENDING",
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
          status: "PENDING",
          comment: `Кэшбэк ${BONUS.CASHBACK_PERCENT}% с покупки`,
        },
      });
    }

    // 3% рефереру
    if (referralBonus > 0 && user.referredById) {
      await tx.bonusTransaction.create({
        data: {
          userId: user.referredById,
          amount: referralBonus,
          type: "REFERRAL",
          purchaseId: purchase.id,
          status: "PENDING",
          comment: `${BONUS.REFERRAL_PERCENT}% от покупки друга`,
        },
      });
    }

    return purchase;
  });

  try {
    const owners = await db.user.findMany({
      where: { role: "OWNER" },
      select: { id: true },
    });
    for (const owner of owners) {
      await sendPushToUser(owner.id, {
        title: "Новый чек на подтверждение",
        body: `${user.name || "Клиент"}: чек ${amount} ₽${bonusesToSpend ? `, списание ${bonusesToSpend} б.` : ""}`,
        url: "/owner",
      });
    }
  } catch (err) {
    console.error("[bonus] push to owners failed", err);
  }

  return { ok: true, purchaseId: result.id, cashback, referralBonus };
}

export type DecisionResult = { ok: true } | { ok: false; error: string };

/** Подтверждение чека владельцем: начисляет балансы и шлёт пуши */
export async function confirmPurchase(purchaseId: string): Promise<DecisionResult> {
  const purchase = await db.purchase.findUnique({
    where: { id: purchaseId },
    include: { bonusTransactions: true, user: { select: { id: true, referredById: true } } },
  });
  if (!purchase) return { ok: false, error: "Чек не найден" };
  if (purchase.status !== "PENDING") return { ok: false, error: "Чек уже обработан" };

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: "CONFIRMED", confirmedAt: now },
    });
    for (const t of purchase.bonusTransactions) {
      if (t.status !== "PENDING") continue;
      await tx.bonusTransaction.update({
        where: { id: t.id },
        data: { status: "CONFIRMED", confirmedAt: now },
      });
      await tx.user.update({
        where: { id: t.userId },
        data: { bonusBalance: { increment: t.amount } },
      });
    }
  });

  const redeemed = purchase.bonusTransactions
    .filter((t) => t.type === "REDEEM")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const cashback = purchase.bonusTransactions
    .filter((t) => t.type === "CASHBACK")
    .reduce((sum, t) => sum + t.amount, 0);
  const referral = purchase.bonusTransactions.find((t) => t.type === "REFERRAL");

  try {
    if (redeemed > 0 && cashback > 0) {
      await sendPushToUser(purchase.user.id, {
        title: "Бонусы по чеку",
        body: `+${cashback} начислено, −${redeemed} списано по чеку ${purchase.amount} ₽`,
        url: "/cabinet",
      });
    } else if (redeemed > 0) {
      await sendPushToUser(purchase.user.id, {
        title: "Бонусы списаны",
        body: `−${redeemed} бонусов (чек ${purchase.amount} ₽)`,
        url: "/cabinet",
      });
    } else if (cashback > 0) {
      await sendPushToUser(purchase.user.id, {
        title: "Бонусы начислены",
        body: `+${cashback} бонусов — кэшбэк за чек`,
        url: "/cabinet",
      });
    }
    if (referral && purchase.user.referredById) {
      await sendPushToUser(purchase.user.referredById, {
        title: "Бонус за друга",
        body: `+${referral.amount} бонусов за покупку друга`,
        url: "/cabinet",
      });
    }
  } catch (err) {
    console.error("[bonus] confirmPurchase push failed", err);
  }

  return { ok: true };
}

/** Отклонение чека владельцем: балансы не меняются */
export async function rejectPurchase(purchaseId: string): Promise<DecisionResult> {
  const purchase = await db.purchase.findUnique({
    where: { id: purchaseId },
    include: { bonusTransactions: true },
  });
  if (!purchase) return { ok: false, error: "Чек не найден" };
  if (purchase.status !== "PENDING") return { ok: false, error: "Чек уже обработан" };

  await db.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: "REJECTED" },
    });
    await tx.bonusTransaction.updateMany({
      where: { purchaseId, status: "PENDING" },
      data: { status: "REJECTED" },
    });
  });

  try {
    await sendPushToUser(purchase.userId, {
      title: "Чек отклонён",
      body: "Начисление по чеку отклонено. Уточните детали у администратора.",
      url: "/cabinet",
    });
  } catch (err) {
    console.error("[bonus] rejectPurchase push failed", err);
  }

  return { ok: true };
}

/** Подтверждение приветственных бонусов */
export async function confirmWelcome(userId: string): Promise<DecisionResult> {
  const welcome = await db.bonusTransaction.findFirst({
    where: { userId, type: "WELCOME", status: "PENDING" },
  });
  if (!welcome) return { ok: false, error: "Заявка не найдена" };

  await db.$transaction(async (tx) => {
    await tx.bonusTransaction.update({
      where: { id: welcome.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
    await tx.user.update({
      where: { id: userId },
      data: { bonusBalance: { increment: welcome.amount } },
    });
  });

  try {
    await sendPushToUser(userId, {
      title: "Бонусы начислены",
      body: `+${welcome.amount} бонусов за регистрацию подтверждены`,
      url: "/cabinet",
    });
  } catch (err) {
    console.error("[bonus] confirmWelcome push failed", err);
  }

  return { ok: true };
}

/** Автоподтверждение заявок, на которых владелец не отреагировал за AUTO_CONFIRM_HOURS часов */
export async function confirmOverdue(): Promise<{ purchases: number; welcomes: number }> {
  const cutoff = new Date(Date.now() - AUTO_CONFIRM_HOURS * 60 * 60 * 1000);

  const purchases = await db.purchase.findMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    select: { id: true },
  });
  let purchasesConfirmed = 0;
  for (const p of purchases) {
    const result = await confirmPurchase(p.id);
    if (result.ok) purchasesConfirmed++;
  }

  const welcomes = await db.bonusTransaction.findMany({
    where: { type: "WELCOME", status: "PENDING", createdAt: { lt: cutoff } },
    select: { userId: true },
  });
  let welcomesConfirmed = 0;
  for (const w of welcomes) {
    const result = await confirmWelcome(w.userId);
    if (result.ok) welcomesConfirmed++;
  }

  return { purchases: purchasesConfirmed, welcomes: welcomesConfirmed };
}

/** Отклонение приветственных бонусов */
export async function rejectWelcome(userId: string): Promise<DecisionResult> {
  const welcome = await db.bonusTransaction.findFirst({
    where: { userId, type: "WELCOME", status: "PENDING" },
  });
  if (!welcome) return { ok: false, error: "Заявка не найдена" };

  await db.bonusTransaction.update({
    where: { id: welcome.id },
    data: { status: "REJECTED" },
  });

  try {
    await sendPushToUser(userId, {
      title: "Бонусы отклонены",
      body: "Приветственные бонусы не подтверждены. Уточните детали у администратора.",
      url: "/cabinet",
    });
  } catch (err) {
    console.error("[bonus] rejectWelcome push failed", err);
  }

  return { ok: true };
}
