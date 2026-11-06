import { BONUS } from "./config";

/** Целые бонусы: округляем вниз, чтобы никогда не превышать долю чека. */
export function maxReceiptRedemption(amount: number): number {
  if (!Number.isSafeInteger(amount) || amount < BONUS.MIN_CHECK_FOR_REDEEM || amount > BONUS.MAX_CHECK) return 0;
  return Math.floor((amount * BONUS.MAX_REDEEM_PERCENT) / 100);
}

export function purchaseInputError(amount: number, bonusesToSpend: number): string | null {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > BONUS.MAX_CHECK) return "Некорректная сумма чека";
  if (!Number.isSafeInteger(bonusesToSpend) || bonusesToSpend < 0) return "Некорректная сумма бонусов";
  if (bonusesToSpend > 0 && amount < BONUS.MIN_CHECK_FOR_REDEEM) {
    return `Бонусы можно списывать только при чеке от ${BONUS.MIN_CHECK_FOR_REDEEM} ₽`;
  }
  const maximum = maxReceiptRedemption(amount);
  if (bonusesToSpend > maximum) {
    return `Бонусами можно оплатить не более ${BONUS.MAX_REDEEM_PERCENT}% чека (${maximum} бонусов)`;
  }
  return null;
}
