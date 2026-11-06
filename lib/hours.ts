import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Укажите время в формате ЧЧ:ММ");
export const hoursSchema = z.object({
  weekdayOpen: time,
  weekdayClose: time,
  weekendOpen: time,
  weekendClose: time,
}).strict();
export type BusinessHours = z.infer<typeof hoursSchema>;
export const DEFAULT_HOURS: BusinessHours = {
  weekdayOpen: "15:00", weekdayClose: "02:00",
  weekendOpen: "15:00", weekendClose: "04:00",
};

export function formatHours(hours: BusinessHours) {
  const text = `Вс–чт: ${hours.weekdayOpen}–${hours.weekdayClose} · пт–сб: ${hours.weekendOpen}–${hours.weekendClose}`;
  return {
    text,
    headline: hours.weekdayOpen === hours.weekendOpen
      ? `каждый день с ${hours.weekdayOpen}` : text,
    structured: [`Su-Th ${hours.weekdayOpen}-${hours.weekdayClose}`, `Fr-Sa ${hours.weekendOpen}-${hours.weekendClose}`],
  };
}
