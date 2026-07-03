import type { Metadata } from "next";
import Link from "next/link";
import { BONUS, BIRTHDAY_PUSH } from "@/lib/config";

export const metadata: Metadata = {
  title: "Бонусная программа и акции",
  description:
    "150 бонусов за регистрацию, кэшбэк 1%, 3% от покупок друга, скидка 10% на день рождения. Бонусная программа тайм-кафе ПРОЕКТОР.",
};

export default function BonusPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="h-display text-3xl md:text-4xl text-brand-dark text-center mb-3">
        Бонусы и акции
      </h1>
      <p className="text-center text-[#3c3c6e] mb-10">
        1 бонус = 1 ₽. Копи и трать прямо на кассе.
      </p>

      <div className="space-y-6">
        <div className="card p-6 md:p-8">
          <h2 className="h-display text-xl text-brand mb-3">🎁 За регистрацию — {BONUS.WELCOME} бонусов</h2>
          <p className="text-[#3c3c6e]">
            Зарегистрируйся по номеру телефона и получи {BONUS.WELCOME} бонусов сразу.
            Списать их можно при чеке от {BONUS.MIN_CHECK_FOR_REDEEM} ₽.
          </p>
        </div>

        <div className="card p-6 md:p-8">
          <h2 className="h-display text-xl text-brand mb-3">💰 Кэшбэк {BONUS.CASHBACK_PERCENT}% с каждой покупки</h2>
          <p className="text-[#3c3c6e]">
            {BONUS.CASHBACK_PERCENT}% от суммы, оплаченной деньгами, возвращается бонусами на твой счёт.
          </p>
        </div>

        <div className="card p-6 md:p-8">
          <h2 className="h-display text-xl text-brand mb-3">👥 Приведи друга — получай {BONUS.REFERRAL_PERCENT}% с его покупок</h2>
          <p className="text-[#3c3c6e]">
            Поделись своей реферальной ссылкой из личного кабинета. Друг зарегистрируется —
            и ты будешь получать {BONUS.REFERRAL_PERCENT}% бонусами от каждой его покупки. Навсегда!
          </p>
        </div>

        <div className="card p-6 md:p-8">
          <h2 className="h-display text-xl text-brand mb-3">🎂 Скидка {BIRTHDAY_PUSH.DISCOUNT_PERCENT}% на день рождения</h2>
          <p className="text-[#3c3c6e]">
            Отмечай день рождения у нас — скидка {BIRTHDAY_PUSH.DISCOUNT_PERCENT}% при
            чеке от {BIRTHDAY_PUSH.MIN_CHECK} ₽. Укажи дату рождения в профиле, и мы
            напомним о празднике заранее.
          </p>
        </div>

        <div className="card p-6 md:p-8 bg-brand-bg">
          <h2 className="h-display text-xl text-brand-dark mb-3">Правила</h2>
          <ul className="text-[#3c3c6e] space-y-1 text-sm list-disc pl-5">
            <li>Бонусами можно оплатить не более {BONUS.MAX_REDEEM_PERCENT}% чека</li>
            <li>Списание бонусов доступно при чеке от {BONUS.MIN_CHECK_FOR_REDEEM} ₽</li>
            <li>Кэшбэк начисляется на сумму, оплаченную деньгами</li>
            <li>Бонусы не выводятся деньгами и не передаются другим</li>
          </ul>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link href="/login" className="btn-brand">
          Зарегистрироваться и получить {BONUS.WELCOME} бонусов
        </Link>
      </div>
    </div>
  );
}
