import assert from "node:assert/strict";
import { DEFAULT_HOURS, formatHours, hoursSchema } from "../lib/hours";

assert.equal(formatHours(DEFAULT_HOURS).headline, "каждый день с 15:00");
assert.deepEqual(formatHours(DEFAULT_HOURS).structured, ["Su-Th 15:00-02:00", "Fr-Sa 15:00-04:00"]);
assert.equal(formatHours({ ...DEFAULT_HOURS, weekendOpen: "14:30" }).headline,
  "Вс–чт: 15:00–02:00 · пт–сб: 14:30–04:00");
for (const value of ["25:00", "12:60", "9:00", "", "<script>"]) {
  assert.equal(hoursSchema.safeParse({ ...DEFAULT_HOURS, weekdayOpen: value }).success, false);
}
assert.equal(hoursSchema.safeParse({ ...DEFAULT_HOURS, weekdayOpen: "00:00" }).success, true);
assert.equal(hoursSchema.safeParse({ ...DEFAULT_HOURS, extra: "not allowed" }).success, false);
assert.equal(hoursSchema.safeParse({ weekdayOpen: "15:00" }).success, false);
console.log("Business hours validation and formatting: PASS");
