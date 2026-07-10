import { SITE } from "@/lib/config";
import { IconMapPin, IconPhone } from "@/components/icons";

export default function MobileDock() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-2 md:hidden border-t-2 border-[#111118] bg-[#f5f1e8] p-2 gap-2">
      <a
        href={`tel:${SITE.PHONE.replace(/[^+\d]/g, "")}`}
        className="btn-brand !min-h-[46px] !py-2 !shadow-none text-sm"
      >
        <IconPhone className="w-4 h-4" />
        Позвонить
      </a>
      <a
        href={SITE.MAP_YANDEX}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline !min-h-[46px] !py-2 text-sm"
      >
        <IconMapPin className="w-4 h-4" />
        Маршрут
      </a>
    </div>
  );
}
