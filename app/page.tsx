import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { BONUS, PRICES, SITE } from "@/lib/config";
import {
  IconMic,
  IconDice,
  IconProjector,
  IconCup,
  IconGift,
  IconPercent,
  IconUsers,
  IconCard,
  IconMapPin,
  IconClock,
  IconPhone,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    Icon: IconMic,
    title: "Караоке",
    text: "Тысячи песен и качественный звук",
    href: "/karaoke",
  },
  {
    Icon: IconDice,
    title: "Настолки",
    text: "Более 100 настольных игр на любую компанию",
    href: "/games",
  },
  {
    Icon: IconProjector,
    title: "Кино и игры",
    text: "Комнаты с проектором и приставками",
    href: "/rooms",
  },
  {
    Icon: IconCup,
    title: "Меню",
    text: "Напитки, снеки и десерты по приятным ценам",
    href: "/menu",
  },
];

export default async function HomePage() {
  const rooms = await db.room.findMany({
    where: { active: true },
    orderBy: { sort: "asc" },
    take: 3,
  });

  return (
    <>
      {/* JSON-LD для поисковиков */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CafeOrCoffeeShop",
            name: SITE.NAME,
            description: SITE.DESCRIPTION,
            url: SITE.URL,
            telephone: SITE.PHONE,
            address: {
              "@type": "PostalAddress",
              addressLocality: SITE.CITY,
              streetAddress: "просп. Мира, 34Б",
            },
            openingHours: "Mo-Su 17:00-04:00",
            image: `${SITE.URL}/img/logo.jpg`,
            priceRange: "₽₽",
          }),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#f2f4ff] to-white">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-24 grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 text-center md:text-left">
            <h1 className="h-display text-3xl sm:text-4xl md:text-5xl text-brand-dark leading-tight">
              Тайм-кафе<br />
              <span className="text-brand">Proектор</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#3c3c6e]">
              Уютные комнаты с большим экраном, караоке, приставки и сотня
              настольных игр. Платишь за время — всё остальное уже включено.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center md:justify-start text-sm font-semibold text-[#3c3c6e]">
              <span className="flex items-center gap-1.5">
                <IconMapPin className="w-4 h-4 text-brand" />
                просп. Мира, 34Б
              </span>
              <span className="flex items-center gap-1.5">
                <IconClock className="w-4 h-4 text-brand" />
                {SITE.HOURS_SHORT}
              </span>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/rooms" className="btn-brand">Выбрать комнату</Link>
              <Link href="/bonus" className="btn-outline">
                +{BONUS.WELCOME} бонусов за регистрацию
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <Image
              src="/img/logo.jpg"
              alt="Логотип тайм-кафе Proектор"
              width={480}
              height={480}
              className="w-56 sm:w-72 md:w-full max-w-md h-auto rounded-3xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* Цены */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <h2 className="h-display text-xl sm:text-2xl md:text-3xl text-brand-dark text-center mb-6 md:mb-10">
          Цены
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-6 text-center">
            <div className="font-extrabold text-brand-dark">Общий зал</div>
            <div className="text-3xl font-black text-brand my-2">
              {PRICES.HALL_PER_PERSON} ₽
            </div>
            <div className="text-sm text-[#3c3c6e]">час с человека</div>
          </div>
          <div className="card p-6 text-center border-2 !border-brand">
            <div className="font-extrabold text-brand-dark">Комнаты</div>
            <div className="text-3xl font-black text-brand my-2">
              {PRICES.ROOM_PER_PERSON} ₽
            </div>
            <div className="text-sm text-[#3c3c6e]">час с человека</div>
          </div>
          <div className="card p-6 text-center">
            <div className="font-extrabold text-brand-dark">Караоке</div>
            <div className="text-3xl font-black text-brand my-2">
              {PRICES.KARAOKE_PER_HOUR} ₽
            </div>
            <div className="text-sm text-[#3c3c6e]">за час</div>
          </div>
        </div>
      </section>

      {/* Что у нас есть */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <h2 className="h-display text-xl sm:text-2xl md:text-3xl text-brand-dark text-center mb-6 md:mb-10">
          Что у нас есть
        </h2>
        <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, text, href }) => (
            <Link key={title} href={href} className="card p-4 md:p-6 hover:shadow-lg transition-shadow">
              <Icon className="w-8 h-8 md:w-10 md:h-10 text-brand mb-3" />
              <div className="font-extrabold text-base md:text-lg text-brand-dark">{title}</div>
              <p className="text-xs md:text-sm text-[#3c3c6e] mt-1">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Комнаты превью */}
      {rooms.length > 0 && (
        <section className="bg-brand-bg py-10 md:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="h-display text-xl sm:text-2xl md:text-3xl text-brand-dark text-center mb-6 md:mb-10">
              Наши комнаты
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {rooms.map((room) => {
                const images = JSON.parse(room.images) as string[];
                return (
                  <Link key={room.id} href="/rooms" className="card overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-[#d9ddf2] flex items-center justify-center">
                      {images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={images[0]} alt={room.name} className="w-full h-full object-cover" />
                      ) : (
                        <IconProjector className="w-14 h-14 text-brand/40" />
                      )}
                    </div>
                    <div className="p-4 md:p-5">
                      <div className="font-extrabold text-brand-dark">{room.name}</div>
                      <p className="text-sm text-[#3c3c6e] mt-1 line-clamp-2">{room.description}</p>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="font-bold text-brand">
                          {PRICES.ROOM_PER_PERSON} ₽/час с чел.
                        </span>
                        <span className="text-[#3c3c6e]">до {room.capacity} чел.</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-8">
              <Link href="/rooms" className="btn-outline">Все комнаты</Link>
            </div>
          </div>
        </section>
      )}

      {/* Бонусная программа */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        <div className="card bg-gradient-to-r from-[#2222b2] to-[#4747d1] !border-0 text-white p-6 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="h-display text-xl sm:text-2xl md:text-3xl mb-4">
                Бонусная программа
              </h2>
              <ul className="space-y-3 text-white/90 text-sm md:text-base">
                <li className="flex items-center gap-3">
                  <IconGift className="w-5 h-5 shrink-0" />
                  <span><b>{BONUS.WELCOME} бонусов</b> сразу за регистрацию</span>
                </li>
                <li className="flex items-center gap-3">
                  <IconPercent className="w-5 h-5 shrink-0" />
                  <span><b>{BONUS.CASHBACK_PERCENT}%</b> от каждой покупки возвращается бонусами</span>
                </li>
                <li className="flex items-center gap-3">
                  <IconUsers className="w-5 h-5 shrink-0" />
                  <span><b>{BONUS.REFERRAL_PERCENT}%</b> от покупок друга по твоей ссылке</span>
                </li>
                <li className="flex items-center gap-3">
                  <IconCard className="w-5 h-5 shrink-0" />
                  <span>Оплачивай бонусами до {BONUS.MAX_REDEEM_PERCENT}% чека</span>
                </li>
              </ul>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-black">1 бонус = 1 ₽</div>
              <Link href="/login" className="btn-brand !bg-white !text-brand mt-6 inline-flex">
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section className="max-w-6xl mx-auto px-4 pb-10 md:pb-16">
        <h2 className="h-display text-xl sm:text-2xl md:text-3xl text-brand-dark text-center mb-6 md:mb-10">
          Как нас найти
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5 flex items-start gap-3">
            <IconMapPin className="w-6 h-6 text-brand shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-brand-dark text-sm">Адрес</div>
              <div className="text-sm text-[#3c3c6e]">{SITE.ADDRESS}</div>
              <div className="flex gap-3 mt-2 text-xs font-bold">
                <a href={SITE.MAP_YANDEX} target="_blank" rel="noopener" className="text-brand hover:underline">
                  Яндекс Карты
                </a>
                <a href={SITE.MAP_2GIS} target="_blank" rel="noopener" className="text-brand hover:underline">
                  2ГИС
                </a>
              </div>
            </div>
          </div>
          <div className="card p-5 flex items-start gap-3">
            <IconClock className="w-6 h-6 text-brand shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-brand-dark text-sm">Время работы</div>
              <div className="text-sm text-[#3c3c6e]">{SITE.HOURS}</div>
            </div>
          </div>
          <div className="card p-5 flex items-start gap-3">
            <IconPhone className="w-6 h-6 text-brand shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-brand-dark text-sm">Телефон</div>
              <a
                href={`tel:${SITE.PHONE.replace(/[^+\d]/g, "")}`}
                className="text-sm text-brand font-bold hover:underline"
              >
                {SITE.PHONE}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
