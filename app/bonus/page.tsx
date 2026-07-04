import type { Metadata } from "next";
import Link from "next/link";
import { BONUS, BIRTHDAY_PUSH } from "@/lib/config";
import { IconGift, IconPercent, IconUsers, IconCake } from "@/components/icons";

export const metadata: Metadata = {
  title: "Бонусная программа и акции",
  description:
    "150 бонусов за регистрацию, кэшбэк 1%, 3% от покупок друга, скидка 10% на день рождения. Бонусная программа тайм-кафе Proектор.",
};

export default function BonusPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <h1 className="h-display text-2xl sm:text-3xl md:text-4xl text-brand-dark text-center mb-3">
        Бонусы и акции
      </h1>
      <p className="text-center text-[#3c3c6e] mb-8 md:mb-10 text-sm md:text-base">
        1 бонус = 1 ₽. Копи и трать прямо на кассе.
      </p>

      <div className="space-y-4 md:space-y-6">
        <div className="card p-5 md:p-8">
          <h2 className="h-display text-lg md:text-xl text-brand mb-3 flex items-center gap-3">
            <IconGift className="w-6 h-6 shrink-0" />
            За регистрацию — {BONUS.WELCOME} бонусов
          </h2>
          <p className="text-[#3c3c6e] text-sm md:text-base">
            Зарегистрируйся по номеру телефона и получи {BONUS.WELCOME} бонусов сразу.
            Списать их можно при чеке от {BONUS.MIN_CHECK_FOR_REDEEM} ₽.
          </p>
        </div>

        <div className="card p-5 md:p-8">
          <h2 className="h-display text-lg md:text-xl text-brand mb-3 flex items-center gap-3">
            <IconPercent className="w-6 h-6 shrink-0" />
            Кэшбэк {BONUS.CASHBACK_PERCENT}% с каждой покупки
          </h2>
          <p className="text-[#3c3c6e] text-sm md:text-base">
            {BONUS.CASHBACK_PERCENT}% от суммы, оплаченной деньгами, возвращается бонусами на твой счёт.
          </p>
        </div>

        <div className="card p-5 md:p-8">
          <h2 className="h-display text-lg md:text-xl text-brand mb-3 flex items-center gap-3">
            <IconUsers className="w-6 h-6 shrink-0" />
            Приведи друга — получай {BONUS.REFERRAL_PERCENT}% с его покупок
          </h2>
          <p className="text-[#3c3c6e] text-sm md:text-base">
            Поделись своей реферальной ссылкой из личного кабинета. Друг зарегистрируется —
            и ты будешь получать {BONUS.REFERRAL_PERCENT}% бонусами от каждой его покупки. Навсегда!
          </p>
        </div>

        <div className="card p-5 md:p-8">
          <h2 className="h-display text-lg md:text-xl text-brand mb-3 flex items-center gap-3">
            <IconCake className="w-6 h-6 shrink-0" />
            Скидка {BIRTHDAY_PUSH.DISCOUNT_PERCENT}% на день рождения
          </h2>
          <p className="text-[#3c3c6e] text-sm md:text-base">
            Отмечай день рождения у нас — скидка {BIRTHDAY_PUSH.DISCOUNT_PERCENT}% при
            чеке от {BIRTHDAY_PUSH.MIN_CHECK} ₽. Укажи дату рождения в профиле, и мы
            напомним о празднике заранее.
          </p>
        </div>

        <div className="card p-5 md:p-8 bg-brand-bg">
          <h2 className="h-display text-lg md:text-xl text-brand-dark mb-3">Правила</h2>
          <ul className="text-[#3c3c6e] space-y-1 text-sm list-disc pl-5">
            <li>Бонусами можно оплатить не более {BONUS.MAX_REDEEM_PERCENT}% чека</li>
            <li>Списание бонусов доступно при чеке от {BONUS.MIN_CHECK_FOR_REDEEM} ₽</li>
            <li>Кэшбэк начисляется на сумму, оплаченную деньгами</li>
            <li>Бонусы не выводятся деньгами и не передаются другим</li>
          </ul>
        </div>
      </div>

      <div className="text-center mt-8 md:mt-10">
        <Link href="/login" className="btn-brand">
          Получить {BONUS.WELCOME} бонусов
        </Link>
      </div>
    </div>
  );
}
