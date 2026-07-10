import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PRICES, SITE } from "@/lib/config";
import { IconUsers, IconPhone } from "@/components/icons";
import { DEFAULT_ROOMS } from "@/lib/rooms";
import RoomGallery from "@/components/RoomGallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Комнаты с проектором и приставками",
  description: `Аренда уютных комнат с проектором и приставками в тайм-кафе Proектор, ${SITE.CITY}. ${PRICES.ROOM_PER_PERSON} ₽/час с человека.`,
};

function parseImages(value: string) {
  try {
    const images: unknown = JSON.parse(value);
    return Array.isArray(images) ? images.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default async function RoomsPage() {
  const databaseRooms = await db.room.findMany({
    where: { active: true },
    orderBy: { sort: "asc" },
  });
  const rooms = databaseRooms.some((room) => parseImages(room.images).length > 0)
    ? databaseRooms
    : DEFAULT_ROOMS;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-20">
      <div className="eyebrow text-brand mb-4">Пространства</div>
      <h1 className="h-display text-4xl sm:text-5xl md:text-7xl text-[#111118] mb-5">
        Наши комнаты
      </h1>
      <p className="text-[#54535c] mb-3 max-w-2xl text-sm md:text-lg">
        Каждая комната — с большим экраном, удобными диванами и своей атмосферой.
        Оплата за время, всё остальное включено.
      </p>
      <p className="font-extrabold text-brand mb-8 md:mb-12">
        {PRICES.ROOM_PER_PERSON} ₽/час с человека · общий зал {PRICES.HALL_PER_PERSON} ₽/час с человека
      </p>

      {rooms.length === 0 && (
        <p className="text-center text-[#3c3c6e]">Комнаты скоро появятся!</p>
      )}

      <div className="grid gap-6 md:gap-8 md:grid-cols-2">
        {rooms.map((room) => {
          const images = parseImages(room.images);
          return (
            <div key={room.id} className="card overflow-hidden">
              <RoomGallery images={images} roomName={room.name} />
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
                  от {room.minCapacity} до {room.capacity} человек
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
