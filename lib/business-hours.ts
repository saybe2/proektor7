import { cache } from "react";
import { db } from "./db";
import { DEFAULT_HOURS, hoursSchema } from "./hours";

export const getBusinessHours = cache(async () => {
  const setting = await db.siteSetting.findUnique({ where: { key: "businessHours" } });
  if (!setting) return DEFAULT_HOURS;
  try {
    const parsed = hoursSchema.safeParse(JSON.parse(setting.value));
    return parsed.success ? parsed.data : DEFAULT_HOURS;
  } catch {
    return DEFAULT_HOURS;
  }
});
