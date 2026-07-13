// Бизнес-правила бонусной системы тайм-кафе «Proектор»

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

export const PRICES = {
  /** Комнаты: руб/час с человека */
  ROOM_PER_PERSON: 250,
  /** Общий зал: руб/час с человека */
  HALL_PER_PERSON: 150,
  /** Караоке: руб/час */
  KARAOKE_PER_HOUR: 500,
} as const;

export const SITE = {
  NAME: "Тайм-кафе Proектор",
  SHORT_NAME: "Proектор",
  URL: process.env.NEXT_PUBLIC_SITE_URL || "https://proektor7.ru",
  DESCRIPTION:
    "Тайм-кафе Proектор в Набережных Челнах — комнаты с проектором и приставками, караоке, настольные игры. 150 бонусов за регистрацию, кэшбэк, скидки за друзей.",
  PHONE: "+7 (960) 087-30-34",
  ADDRESS: "Набережные Челны, просп. Мира, 34Б (цокольный этаж)",
  CITY: "Набережные Челны",
  HOURS: "Ежедневно с 17:00 до 04:00",
  HOURS_SHORT: "17:00–04:00",
  MAP_YANDEX: "https://yandex.ru/maps/org/proyektor/63843978209/",
  MAP_2GIS:
    "https://2gis.ru/nabchelny/inside/4082022817479740/firm/70000001029411730/",
  TELEGRAM_URL: process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/share/url?url=https%3A%2F%2Fproektor7.ru",
  MAX_URL: process.env.NEXT_PUBLIC_MAX_URL || "https://max.ru/",
} as const;
