import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PRICES, SITE } from "@/lib/config";
import { IconProjector, IconUsers, IconPhone } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Комнаты с проектором и приставками",
  description: `Аренда уютных комнат с проектором и приставками в тайм-кафе Proектор, ${SITE.CITY}. ${PRICES.ROOM_PER_PERSON} ₽/час с человека.`,
};

export default async function RoomsPage() {
  const rooms = await db.room.findMany({
    where: { active: true },
    orderBy: { sort: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <h1 className="h-display text-2xl sm:text-3xl md:text-4xl text-brand-dark text-center mb-3">
        Наши комнаты
      </h1>
      <p className="text-center text-[#3c3c6e] mb-3 max-w-2xl mx-auto text-sm md:text-base">
        Каждая комната — с большим экраном, удобными диванами и своей атмосферой.
        Оплата за время, всё остальное включено.
      </p>
      <p className="text-center font-extrabold text-brand mb-8 md:mb-10">
        {PRICES.ROOM_PER_PERSON} ₽/час с человека · общий зал {PRICES.HALL_PER_PERSON} ₽/час с человека
      </p>

      {rooms.length === 0 && (
        <p className="text-center text-[#3c3c6e]">Комнаты скоро появятся!</p>
      )}

      <div className="grid gap-6 md:gap-8 md:grid-cols-2">
        {rooms.map((room) => {
          const images = JSON.parse(room.images) as string[];
          return (
            <div key={room.id} className="card overflow-hidden">
              <div className="aspect-video bg-[#d9ddf2] flex items-center justify-center overflow-hidden">
                {images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[0]} alt={room.name} className="w-full h-full object-cover" />
                ) : (
                  <IconProjector className="w-16 h-16 text-brand/40" />
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto">
                  {images.slice(1).map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt={`${room.name} фото ${i + 2}`}
                      className="h-16 w-28 md:h-20 md:w-32 object-cover rounded-lg shrink-0"
                    />
                  ))}
                </div>
              )}
              <div className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-extrabold text-lg md:text-xl text-brand-dark">
                    {room.name}
                  </h2>
                  <div className="text-right shrink-0">
                    <div className="font-black text-brand text-lg md:text-xl">
                      {PRICES.ROOM_PER_PERSON} ₽
                    </div>
                    <div className="text-xs text-[#3c3c6e]">час с человека</div>
                  </div>
                </div>
                <p className="text-sm md:text-base text-[#3c3c6e] mt-2">{room.description}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-dark">
                  <IconUsers className="w-4 h-4 text-brand" />
                  до {room.capacity} человек
                </div>
                <a
                  href={`tel:${SITE.PHONE.replace(/[^+\d]/g, "")}`}
                  className="btn-brand w-full mt-5"
                >
                  <IconPhone className="w-4 h-4" />
                  Забронировать
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
