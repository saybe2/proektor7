import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { BONUS, SITE } from "@/lib/config";

export const dynamic = "force-dynamic";

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
            address: { "@type": "PostalAddress", streetAddress: SITE.ADDRESS },
            image: `${SITE.URL}/img/logo.jpg`,
            priceRange: "₽₽",
          }),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#f2f4ff] to-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="h-display text-4xl md:text-5xl text-brand-dark leading-tight">
              Тайм-кафе<br />
              <span className="text-brand">ПРОЕКТОР</span>
            </h1>
            <p className="mt-4 text-lg text-[#3c3c6e]">
              Уютные комнаты с большим экраном, караоке, PlayStation и сотней
              настольных игр. Платишь за время — всё остальное уже включено!
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/rooms" className="btn-brand">Выбрать комнату</Link>
              <Link href="/bonus" className="btn-outline">
                +{BONUS.WELCOME} бонусов за регистрацию
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <Image
              src="/img/logo.jpg"
              alt="Логотип тайм-кафе ПРОЕКТОР"
              width={480}
              height={480}
              className="w-full max-w-md h-auto rounded-3xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* Что у нас есть */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="h-display text-2xl md:text-3xl text-brand-dark text-center mb-10">
          Что у нас есть
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "🎤", title: "Караоке", text: "Тысячи песен, качественный звук и микрофоны", href: "/karaoke" },
            { icon: "🎲", title: "Настолки", text: "Более 100 настольных игр на любую компанию", href: "/games" },
            { icon: "📽️", title: "Кино и игры", text: "Комнаты с проектором и PlayStation", href: "/rooms" },
            { icon: "🍪", title: "Меню", text: "Напитки, снеки и десерты по приятным ценам", href: "/menu" },
          ].map((f) => (
            <Link key={f.title} href={f.href} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">{f.icon}</div>
              <div className="font-extrabold text-lg text-brand-dark">{f.title}</div>
              <p className="text-sm text-[#3c3c6e] mt-1">{f.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Комнаты превью */}
      {rooms.length > 0 && (
        <section className="bg-brand-bg py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="h-display text-2xl md:text-3xl text-brand-dark text-center mb-10">
              Наши комнаты
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {rooms.map((room) => {
                const images = JSON.parse(room.images) as string[];
                return (
                  <Link key={room.id} href="/rooms" className="card overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-[#d9ddf2] flex items-center justify-center">
                      {images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={images[0]} alt={room.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl">📽️</span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="font-extrabold text-brand-dark">{room.name}</div>
                      <p className="text-sm text-[#3c3c6e] mt-1 line-clamp-2">{room.description}</p>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="font-bold text-brand">{room.price} ₽/час</span>
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
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="card bg-gradient-to-r from-[#2222b2] to-[#4747d1] !border-0 text-white p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="h-display text-2xl md:text-3xl mb-4">Бонусная программа</h2>
              <ul className="space-y-2 text-white/90">
                <li>🎁 <b>{BONUS.WELCOME} бонусов</b> сразу за регистрацию</li>
                <li>💰 <b>{BONUS.CASHBACK_PERCENT}%</b> от каждой покупки возвращается бонусами</li>
                <li>👥 <b>{BONUS.REFERRAL_PERCENT}%</b> от покупок друга по твоей ссылке</li>
                <li>💳 Оплачивай бонусами до {BONUS.MAX_REDEEM_PERCENT}% чека</li>
              </ul>
            </div>
            <div className="text-center">
              <div className="text-6xl font-black">1 бонус = 1 ₽</div>
              <Link href="/login" className="btn-brand !bg-white !text-brand mt-6 inline-flex">
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
