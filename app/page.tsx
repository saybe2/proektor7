import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { BONUS, PRICES, SITE } from "@/lib/config";
import { DEFAULT_ROOMS } from "@/lib/rooms";
import {
  IconClock,
  IconDice,
  IconGift,
  IconMapPin,
  IconMic,
  IconPhone,
  IconProjector,
  IconUsers,
} from "@/components/icons";

export const dynamic = "force-dynamic";

function parseImages(value: string) {
  try {
    const images: unknown = JSON.parse(value);
    return Array.isArray(images) ? images.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

const SERVICES = [
  { Icon: IconProjector, number: "01", title: "Своя комната", text: "Большой экран, приставки и диваны только для вашей компании.", href: "/rooms" },
  { Icon: IconMic, number: "02", title: "Караоке", text: "Пойте без очереди и посторонних. Оплата — 500 рублей за час.", href: "/karaoke" },
  { Icon: IconDice, number: "03", title: "Настольные игры", text: "Игры для двоих и больших компаний уже входят в стоимость времени.", href: "/games" },
];

export default async function HomePage() {
  const databaseRooms = await db.room.findMany({ where: { active: true }, orderBy: { sort: "asc" }, take: 3 });
  const rooms = databaseRooms.some((room) => parseImages(room.images).length > 0)
    ? databaseRooms
    : DEFAULT_ROOMS.slice(0, 3);
  const ticker = "КОМНАТЫ 250 ₽/ЧАС С ЧЕЛОВЕКА · ОБЩИЙ ЗАЛ 150 ₽/ЧАС С ЧЕЛОВЕКА · КАРАОКЕ 500 ₽/ЧАС · ";

  return (
    <>
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
            address: { "@type": "PostalAddress", addressLocality: SITE.CITY, streetAddress: "просп. Мира, 34Б" },
            openingHours: "Mo-Su 17:00-04:00",
            image: `${SITE.URL}/img/logo.jpg`,
            priceRange: "₽₽",
          }),
        }}
      />

      <section className="relative overflow-hidden border-b-2 border-[#111118]">
        <div className="absolute right-[-8rem] top-16 h-72 w-72 rounded-full bg-[#ff5c35] blur-[1px] opacity-90 md:h-[30rem] md:w-[30rem]" />
        <div className="absolute left-[-5rem] bottom-[-8rem] h-64 w-64 rounded-full border-[45px] border-[#2020c7] opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-20 grid md:grid-cols-[1.2fr_.8fr] gap-10 items-center min-h-[670px] md:min-h-[720px]">
          <div className="z-10">
            <div className="eyebrow text-brand mb-6">Набережные Челны · ежедневно до 04:00</div>
            <h1 className="h-display text-[clamp(3rem,12vw,7.5rem)] text-[#111118]">
              Твоё<br />место<br /><span className="text-brand">в городе</span>
            </h1>
            <p className="mt-7 max-w-xl text-base md:text-xl font-semibold leading-relaxed text-[#45444d]">
              Тайм-кафе для встреч, игр и праздников. Выбирайте отдельную комнату или общий зал — платите только за время.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/rooms" className="btn-brand">Посмотреть комнаты</Link>
              <a href={`tel:${SITE.PHONE.replace(/[^+\d]/g, "")}`} className="btn-outline">
                <IconPhone className="w-5 h-5" /> {SITE.PHONE}
              </a>
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-md md:max-w-none">
            <div className="absolute -left-4 -top-5 z-10 rotate-[-5deg] bg-[#ffdd38] border-2 border-[#111118] px-4 py-2 text-xs font-black uppercase tracking-widest">
              Рейтинг 5,0 на Яндекс Картах
            </div>
            <div className="border-2 border-[#111118] bg-white p-4 shadow-[12px_12px_0_#111118] rotate-[2deg]">
              <Image src="/img/logo.jpg" alt="Логотип тайм-кафе Proектор" width={700} height={700} priority className="w-full aspect-square object-cover" />
              <div className="grid grid-cols-2 gap-3 mt-4 font-black text-xs uppercase">
                <span className="flex items-center gap-2"><IconMapPin className="w-4 h-4 text-brand" />Мира, 34Б</span>
                <span className="flex items-center gap-2"><IconClock className="w-4 h-4 text-brand" />17:00–04:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="ticker" aria-label="Основные цены">
        <div className="ticker-track"><span>{ticker}{ticker}</span><span aria-hidden="true">{ticker}{ticker}</span></div>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-[.7fr_1.3fr] gap-8 md:gap-16 items-end mb-10">
          <div><div className="eyebrow text-brand mb-4">Стоимость</div><h2 className="h-display text-4xl md:text-6xl">Всё просто</h2></div>
          <p className="text-[#54535c] max-w-xl md:ml-auto md:text-lg">Никаких сложных тарифов. Комната оплачивается за каждого гостя, караоке — отдельно за время использования.</p>
        </div>
        <div className="grid md:grid-cols-3 border-2 border-[#111118] bg-[#fffefa]">
          {[
            ["Общий зал", PRICES.HALL_PER_PERSON, "час с человека"],
            ["Любая комната", PRICES.ROOM_PER_PERSON, "час с человека"],
            ["Караоке", PRICES.KARAOKE_PER_HOUR, "за один час"],
          ].map(([name, price, unit], index) => (
            <div key={name} className={`p-6 md:p-8 ${index < 2 ? "border-b-2 md:border-b-0 md:border-r-2 border-[#111118]" : ""}`}>
              <div className="text-xs font-black uppercase tracking-[.16em] text-[#66656f]">0{index + 1} / {name}</div>
              <div className="mt-5 flex items-end gap-2"><strong className="h-display text-5xl md:text-6xl text-brand">{price}</strong><span className="font-black pb-1">₽</span></div>
              <div className="mt-2 text-sm font-bold text-[#66656f]">{unit}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#111118] text-white py-16 md:py-24 border-y-2 border-[#111118]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="eyebrow text-[#8b8dff] mb-4">Чем заняться</div>
          <h2 className="h-display text-4xl md:text-7xl max-w-4xl mb-12">Вечер выбираете вы</h2>
          <div className="grid md:grid-cols-3 gap-px bg-white/25 border border-white/25">
            {SERVICES.map(({ Icon, number, title, text, href }) => (
              <Link href={href} key={title} className="group bg-[#111118] p-6 md:p-8 min-h-72 flex flex-col hover:bg-[#2020c7] transition-colors">
                <div className="flex justify-between"><span className="font-black text-white/50">{number}</span><Icon className="w-10 h-10 text-[#8b8dff] group-hover:text-white" /></div>
                <div className="mt-auto"><h3 className="h-display text-2xl mb-3">{title}</h3><p className="text-white/65 text-sm leading-relaxed">{text}</p><div className="mt-5 font-black text-sm uppercase">Подробнее →</div></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="flex items-end justify-between gap-4 mb-10"><div><div className="eyebrow text-brand mb-4">Пространства</div><h2 className="h-display text-4xl md:text-6xl">Комнаты</h2></div><Link href="/rooms" className="hidden sm:inline-flex btn-outline">Смотреть все</Link></div>
        {rooms.length > 0 ? (
          <div className="grid gap-7 md:grid-cols-3">
            {rooms.map((room, index) => {
              const image = parseImages(room.images)[0];
              return <Link href="/rooms" key={room.id} className="group card overflow-hidden">
                <div className="relative aspect-[4/3] bg-[#dcd9cf] overflow-hidden">
                  {image ? <Image src={image} alt={room.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="h-full flex items-center justify-center"><IconProjector className="w-16 h-16 text-brand/35" /></div>}
                  <div className="absolute left-3 top-3 bg-[#ffdd38] border-2 border-[#111118] px-3 py-1 text-xs font-black">0{index + 1}</div>
                </div>
                <div className="p-5"><div className="flex justify-between gap-3"><h3 className="h-display text-xl">{room.name}</h3><span className="font-black text-brand whitespace-nowrap">{PRICES.ROOM_PER_PERSON} ₽</span></div><p className="text-sm text-[#66656f] mt-3 line-clamp-2">{room.description}</p><div className="mt-5 flex items-center gap-2 text-xs font-black uppercase"><IconUsers className="w-4 h-4 text-brand" /> До {room.capacity} человек</div></div>
              </Link>;
            })}
          </div>
        ) : <div className="border-2 border-dashed border-[#111118] p-10 text-center font-bold">Фотографии комнат скоро появятся. Пока можно уточнить свободное время по телефону.</div>}
        <Link href="/rooms" className="sm:hidden btn-outline w-full mt-7">Смотреть все комнаты</Link>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-16 md:pb-24">
        <div className="relative overflow-hidden bg-[#2020c7] text-white border-2 border-[#111118] shadow-[9px_9px_0_#111118] p-6 md:p-12">
          <div className="absolute right-[-3rem] top-[-5rem] h-56 w-56 rounded-full bg-[#ff5c35]" />
          <div className="relative grid md:grid-cols-[1.1fr_.9fr] gap-10 items-center">
            <div><div className="eyebrow text-white/70 mb-4">Бонусная система</div><h2 className="h-display text-4xl md:text-6xl">Быть своим выгодно</h2><p className="mt-5 max-w-xl text-white/75">Получите {BONUS.WELCOME} бонусов при регистрации, возвращайте {BONUS.CASHBACK_PERCENT}% с покупок и {BONUS.REFERRAL_PERCENT}% с покупок приглашённых друзей.</p></div>
            <div className="bg-[#fffefa] text-[#111118] border-2 border-[#111118] p-6 md:p-8 rotate-[-2deg]">
              <IconGift className="w-10 h-10 text-brand mb-4" /><div className="h-display text-4xl">{BONUS.WELCOME} бонусов</div><p className="mt-3 text-sm text-[#66656f]">Списывайте до {BONUS.MAX_REDEEM_PERCENT}% покупки при чеке от {BONUS.MIN_CHECK_FOR_REDEEM} ₽.</p><Link href="/login" className="btn-brand mt-6 w-full">Зарегистрироваться</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-[#111118] bg-[#ffdd38]">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div><div className="eyebrow mb-4">Мы на карте</div><h2 className="h-display text-4xl md:text-6xl">Центр города.<br />Цокольный этаж.</h2></div>
          <div className="space-y-5 font-bold"><p className="flex gap-3"><IconMapPin className="w-6 h-6 shrink-0" />{SITE.ADDRESS}</p><p className="flex gap-3"><IconClock className="w-6 h-6 shrink-0" />{SITE.HOURS}</p><div className="flex flex-col sm:flex-row gap-3 pt-2"><a className="btn-brand" href={SITE.MAP_YANDEX} target="_blank" rel="noopener noreferrer">Открыть Яндекс Карты</a><a className="btn-outline !bg-transparent" href={SITE.MAP_2GIS} target="_blank" rel="noopener noreferrer">Открыть 2ГИС</a></div></div>
        </div>
      </section>
    </>
  );
}
