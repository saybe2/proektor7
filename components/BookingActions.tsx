"use client";

import { useState } from "react";
import { SITE } from "@/lib/config";
import { IconPhone } from "@/components/icons";

export default function BookingActions({ label = "Забронировать" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mt-5">
      <button type="button" className="btn-brand booking-shimmer w-full" onClick={() => setOpen(!open)} aria-expanded={open}>
        {label}
      </button>
      {open && (
        <div className="absolute left-0 right-0 bottom-full z-20 mb-2 grid gap-2 border-2 border-[#111118] bg-[#fffefa] p-3 shadow-[5px_5px_0_#111118]">
          <a href={SITE.MAX_URL} target="_blank" rel="noopener noreferrer" className="btn-brand !shadow-none">Написать в MAX</a>
          <a href={SITE.TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn-outline">Написать в Telegram</a>
          <a href={`tel:${SITE.PHONE.replace(/[^+\d]/g, "")}`} className="btn-outline"><IconPhone className="w-4 h-4" />Позвонить</a>
          <p className="text-center text-xs text-[#66656f]">Администратор подтвердит свободное время</p>
        </div>
      )}
    </div>
  );
}
