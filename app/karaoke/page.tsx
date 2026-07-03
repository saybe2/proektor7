import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Караоке",
  description:
    "Караоке в тайм-кафе ПРОЕКТОР: тысячи песен, профессиональный звук, уютные комнаты для компании. Пой сколько хочешь — оплата за время!",
};

export default function KaraokePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="h-display text-3xl md:text-4xl text-brand-dark text-center mb-3">
        🎤 Караоке
      </h1>
      <p className="text-center text-[#3c3c6e] mb-10 max-w-2xl mx-auto">
        Пой любимые песни в своей компании — без чужих ушей и очереди на микрофон.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {[
          { icon: "🎵", title: "Тысячи песен", text: "Огромный каталог: от русских хитов до K-pop. Обновляется постоянно." },
          { icon: "🔊", title: "Качественный звук", text: "Хорошие микрофоны и колонки — звучать будешь как на сцене." },
          { icon: "🛋️", title: "Своя комната", text: "Никаких незнакомцев: только ты и твоя компания." },
          { icon: "⏱️", title: "Оплата за время", text: "Караоке включено в стоимость комнаты. Никаких доплат за песни." },
        ].map((f) => (
          <div key={f.title} className="card p-6">
            <div className="text-4xl mb-3">{f.icon}</div>
            <div className="font-extrabold text-lg text-brand-dark">{f.title}</div>
            <p className="text-sm text-[#3c3c6e] mt-1">{f.text}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-10 space-x-3">
        <Link href="/rooms" className="btn-brand">Выбрать комнату</Link>
        <a href={`tel:${SITE.PHONE.replace(/[^+\d]/g, "")}`} className="btn-outline">
          Позвонить
        </a>
      </div>
    </div>
  );
}
