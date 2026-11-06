import { db } from "./db";
import { Prisma } from "@prisma/client";
import { AUTO_CONFIRM_HOURS, BONUS } from "./config";
import { sendPushToUser } from "./push";
import { randomInt } from "node:crypto";
import { purchaseInputError } from "./redemption";

type DbClient = Prisma.TransactionClient | typeof db;

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
 * Доступные к списанию бонусы: баланс минус то, что заморожено
 * в неподтверждённых чеках. Запросы последовательные — внутри транзакции
 * параллельные обращения к одному соединению небезопасны.
 */
export async function getBonusState(userId: string, client: DbClient = db) {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { bonusBalance: true },
  });
  const pending = await client.bonusTransaction.aggregate({
    where: { userId, type: "REDEEM", status: "PENDING" },
    _sum: { amount: true },
  });
  const balance = user?.bonusBalance ?? 0;
  const pendingRedeem = Math.abs(pending._sum.amount || 0);
  return { balance, pendingRedeem, available: balance - pendingRedeem };
}

/**
 * Гостевая запись: касса завела клиента по телефону, но номер не подтверждён
 * и согласия не подписаны. Бонусы начисляются и ждут регистрации.
 */
export async function findOrCreateGuest(phone: string) {
  const existing = await db.user.findUnique({ where: { phone } });
  if (existing) return existing;

  // повтор нужен на два случая: параллельный запрос с тем же телефоном
  // и совпадение сгенерированного реферального кода
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.user.create({
        data: { phone, refCode: generateRefCode(), isGuest: true },
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
      const created = await db.user.findUnique({ where: { phone } });
      if (created) return created;
    }
  }
  throw new Error("Не удалось создать гостевую запись");
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
}, client: DbClient = db) {
  const referrer = params.refCode
    ? await findReferrer(params.refCode, client)
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

/**
 * Превращение гостя в полноценный аккаунт после подтверждения номера.
 * Бонусы, накопленные до регистрации, сохраняются — сверху идут приветственные.
 */
export async function convertGuestToClient(params: {
  userId: string;
  name?: string;
  birthDate?: Date;
  refCode?: string;
  privacyAcceptedAt: Date;
  privacyVersion: string;
}, client: DbClient = db) {
  const referrer = params.refCode
    ? await findReferrer(params.refCode, client)
    : null;

  return client.user.update({
    where: { id: params.userId },
    data: {
      isGuest: false,
      name: params.name,
      birthDate: params.birthDate,
      // у гостя уже есть собственный код — на себя пригласить нельзя
      referredById: referrer && referrer.id !== params.userId ? referrer.id : undefined,
      privacyAcceptedAt: params.privacyAcceptedAt,
      privacyVersion: params.privacyVersion,
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

/** Пригласивший: гостевые записи кодами не делятся, их код нигде не показан */
function findReferrer(refCode: string, client: DbClient = db) {
  return client.user.findFirst({ where: { refCode, isGuest: false } });
}

export type PurchaseResult =
  | {
      ok: true;
      purchaseId: string;
      cashback: number;
      referralBonus: number;
      /** Сколько бонусов списано (заморожено до подтверждения) */
      bonusesSpent: number;
      /** Доступно к списанию после операции: кэшбэк ещё ждёт подтверждения */
      newBalance: number;
      /** Чек проведён на гостя — бонусы копятся, но списать их нельзя */
      isGuest: boolean;
    }
  | { ok: false; error: string };

/**
 * Проведение покупки админом:
 * - проверка лимитов списания (20% чека, чек от 500₽)
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

  const inputError = purchaseInputError(amount, bonusesToSpend);
  if (inputError) return { ok: false, error: inputError };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Клиент не найден" };
  if (user.role !== "CLIENT") return { ok: false, error: "Операцию можно провести только для клиента" };

  if (bonusesToSpend > 0) {
    // Гость не подтверждал номер и не подписывал согласия: накопленные бонусы
    // ждут регистрации, иначе списать их мог бы любой, кто назвал чужой телефон.
    if (user.isGuest) {
      return {
        ok: false,
        error: "Гость не зарегистрирован на сайте — списать бонусы нельзя",
      };
    }
    const { available } = await getBonusState(userId);
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
    // Проверку доступных бонусов повторяем внутри транзакции: между чтением
    // выше и записью баланс мог измениться (параллельный чек, корректировка).
    if (bonusesToSpend > 0) {
      const { available: availableNow } = await getBonusState(userId, tx);
      if (bonusesToSpend > availableNow) {
        return { error: `Недостаточно бонусов (доступно ${availableNow})`, purchase: null };
      }
    }

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

    return { error: null, purchase };
  });

  if (result.error !== null) return { ok: false, error: result.error };

  try {
    const owners = await db.user.findMany({
      where: { role: { in: ["OWNER", "DEVELOPER"] } },
      select: { id: true },
    });
    for (const owner of owners) {
      await sendPushToUser(owner.id, {
        title: "Новый чек на подтверждение",
        body: `${user.name || (user.isGuest ? "Гость" : "Клиент")}: чек ${amount} ₽${bonusesToSpend ? `, списание ${bonusesToSpend} б.` : ""}`,
        url: "/owner",
      });
    }
  } catch (err) {
    console.error("[bonus] push to owners failed", err);
  }

  // баланс к списанию после операции: кэшбэк ещё ждёт подтверждения,
  // а списанные бонусы уже заморожены
  const { available } = await getBonusState(userId);

  return {
    ok: true,
    purchaseId: result.purchase.id,
    cashback,
    referralBonus,
    bonusesSpent: bonusesToSpend,
    newBalance: available,
    isGuest: user.isGuest,
  };
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
  // Статус переводим условным апдейтом: если параллельный запрос (владелец
  // и крон одновременно) уже подтвердил чек, второй ничего не начислит.
  const applied = await db.$transaction(async (tx) => {
    const claimed = await tx.purchase.updateMany({
      where: { id: purchaseId, status: "PENDING" },
      data: { status: "CONFIRMED", confirmedAt: now },
    });
    if (claimed.count !== 1) return false;

    for (const t of purchase.bonusTransactions) {
      const claimedTransaction = await tx.bonusTransaction.updateMany({
        where: { id: t.id, status: "PENDING" },
        data: { status: "CONFIRMED", confirmedAt: now },
      });
      if (claimedTransaction.count !== 1) continue;
      await tx.user.update({
        where: { id: t.userId },
        data: { bonusBalance: { increment: t.amount } },
      });
    }
    return true;
  });

  if (!applied) return { ok: false, error: "Чек уже обработан" };

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
    await tx.purchase.updateMany({
      where: { id: purchaseId, status: "PENDING" },
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

  const applied = await db.$transaction(async (tx) => {
    const claimed = await tx.bonusTransaction.updateMany({
      where: { id: welcome.id, status: "PENDING" },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
    if (claimed.count !== 1) return false;
    await tx.user.update({
      where: { id: userId },
      data: { bonusBalance: { increment: welcome.amount } },
    });
    return true;
  });

  if (!applied) return { ok: false, error: "Заявка уже обработана" };

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
    try {
      const result = await confirmPurchase(p.id);
      if (result.ok) purchasesConfirmed++;
    } catch (err) {
      // одна проблемная запись не должна останавливать весь прогон крона
      console.error("[bonus] auto-confirm purchase failed", p.id, err);
    }
  }

  const welcomes = await db.bonusTransaction.findMany({
    where: { type: "WELCOME", status: "PENDING", createdAt: { lt: cutoff } },
    select: { userId: true },
    distinct: ["userId"],
  });
  let welcomesConfirmed = 0;
  for (const w of welcomes) {
    try {
      const result = await confirmWelcome(w.userId);
      if (result.ok) welcomesConfirmed++;
    } catch (err) {
      console.error("[bonus] auto-confirm welcome failed", w.userId, err);
    }
  }

  return { purchases: purchasesConfirmed, welcomes: welcomesConfirmed };
}

/** Отклонение приветственных бонусов */
export async function rejectWelcome(userId: string): Promise<DecisionResult> {
  const welcome = await db.bonusTransaction.findFirst({
    where: { userId, type: "WELCOME", status: "PENDING" },
  });
  if (!welcome) return { ok: false, error: "Заявка не найдена" };

  const rejected = await db.bonusTransaction.updateMany({
    where: { id: welcome.id, status: "PENDING" },
    data: { status: "REJECTED" },
  });
  if (rejected.count !== 1) return { ok: false, error: "Заявка уже обработана" };

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
