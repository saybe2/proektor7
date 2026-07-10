import Link from "next/link";
import { SITE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="bg-[#111118] text-white mt-12 md:mt-20 pb-20 md:pb-0 border-t-2 border-[#111118]">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 grid gap-10 sm:grid-cols-3">
        <div>
          <div className="h-display text-2xl mb-3 text-[#6f72ff]">Proектор</div>
          <p className="text-white/70 text-sm">
            Тайм-кафе: комнаты с проектором, караоке, настольные игры и вкусное меню.
          </p>
        </div>
        <div>
          <div className="font-extrabold mb-2">Разделы</div>
          <ul className="space-y-1 text-white/80 text-sm">
            <li><Link href="/rooms" className="hover:text-white">Комнаты</Link></li>
            <li><Link href="/menu" className="hover:text-white">Меню</Link></li>
            <li><Link href="/karaoke" className="hover:text-white">Караоке</Link></li>
            <li><Link href="/games" className="hover:text-white">Настольные игры</Link></li>
            <li><Link href="/bonus" className="hover:text-white">Бонусная программа</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-extrabold mb-2">Контакты</div>
          <p className="text-white/80 text-sm">{SITE.ADDRESS}</p>
          <p className="text-white/80 text-sm mt-1">{SITE.HOURS}</p>
          <p className="text-white/80 text-sm mt-1">
            <a href={`tel:${SITE.PHONE.replace(/[^+\d]/g, "")}`} className="hover:text-white font-bold">
              {SITE.PHONE}
            </a>
          </p>
          <div className="flex gap-3 mt-2 text-sm">
            <a href={SITE.MAP_YANDEX} target="_blank" rel="noopener" className="text-white/80 hover:text-white underline">
              Яндекс Карты
            </a>
            <a href={SITE.MAP_2GIS} target="_blank" rel="noopener" className="text-white/80 hover:text-white underline">
              2ГИС
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-white/50 text-xs">
        {new Date().getFullYear()} Тайм-кафе «Proектор» · proektor7.ru
      </div>
    </footer>
  );
}
