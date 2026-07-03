// Бизнес-правила бонусной системы тайм-кафе «ПРОЕКТОР»

export const BONUS = {
  /** Приветственные бонусы за регистрацию */
  WELCOME: 150,
  /** Кэшбэк от собственных покупок, % */
  CASHBACK_PERCENT: 1,
  /** Бонусы рефереру от покупок друга, % */
  REFERRAL_PERCENT: 3,
  /** Максимальная доля чека, оплачиваемая бонусами, % */
  MAX_REDEEM_PERCENT: 50,
  /** Минимальный чек для списания бонусов, руб */
  MIN_CHECK_FOR_REDEEM: 500,
} as const;

export const BIRTHDAY_PUSH = {
  /** За сколько дней до ДР слать пуш */
  DAYS_BEFORE: [14, 7, 4],
  DISCOUNT_PERCENT: 10,
  MIN_CHECK: 5000,
} as const;

export const SITE = {
  NAME: "Тайм-кафе ПРОЕКТОР",
  SHORT_NAME: "ПРОЕКТОР",
  URL: process.env.NEXT_PUBLIC_SITE_URL || "https://proektor7.ru",
  DESCRIPTION:
    "Тайм-кафе ПРОЕКТОР — уютные комнаты с проектором, караоке, настольные игры, PlayStation. Бонусная программа: 150 бонусов за регистрацию, кэшбэк 1%, скидки за друзей.",
  PHONE: "+7 (900) 000-00-00", // заменить на реальный
  ADDRESS: "г. Ваш город, ул. Примерная, 1", // заменить на реальный
} as const;
