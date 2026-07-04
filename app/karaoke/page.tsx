import type { Metadata } from "next";
import Link from "next/link";
import { PRICES, SITE } from "@/lib/config";
import { IconMusic, IconVolume, IconSofa, IconClock, IconPhone } from "@/components/icons";

export const metadata: Metadata = {
  title: "Караоке",
  description: `Караоке в тайм-кафе Proектор, ${SITE.CITY}: тысячи песен, качественный звук, своя комната для компании. ${PRICES.KARAOKE_PER_HOUR} ₽/час.`,
};

const FEATURES = [
  {
    Icon: IconMusic,
    title: "Тысячи песен",
    text: "Огромный каталог: от русских хитов до K-pop. Обновляется постоянно.",
  },
  {
    Icon: IconVolume,
    title: "Качественный звук",
    text: "Хорошие микрофоны и колонки — звучать будешь как на сцене.",
  },
  {
    Icon: IconSofa,
    title: "Своя комната",
    text: "Никаких незнакомцев: только ты и твоя компания.",
  },
  {
    Icon: IconClock,
    title: "Оплата за время",
    text: `${PRICES.KARAOKE_PER_HOUR} ₽ в час — и никаких доплат за песни.`,
  },
];

export default function KaraokePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <h1 className="h-display text-2xl sm:text-3xl md:text-4xl text-brand-dark text-center mb-3">
        Караоке
      </h1>
      <p className="text-center text-[#3c3c6e] mb-3 max-w-2xl mx-auto text-sm md:text-base">
        Пой любимые песни в своей компании — без чужих ушей и очереди на микрофон.
      </p>
      <p className="text-center font-extrabold text-brand text-xl mb-8 md:mb-10">
        {PRICES.KARAOKE_PER_HOUR} ₽/час
      </p>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
        {FEATURES.map(({ Icon, title, text }) => (
          <div key={title} className="card p-5 md:p-6 flex sm:block items-start gap-4">
            <Icon className="w-8 h-8 md:w-10 md:h-10 text-brand shrink-0 sm:mb-3" />
            <div>
              <div className="font-extrabold text-base md:text-lg text-brand-dark">{title}</div>
              <p className="text-sm text-[#3c3c6e] mt-1">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/rooms" className="btn-brand">Выбрать комнату</Link>
        <a href={`tel:${SITE.PHONE.replace(/[^+\d]/g, "")}`} className="btn-outline">
          <IconPhone className="w-4 h-4" />
          Позвонить
        </a>
      </div>
    </div>
  );
}
