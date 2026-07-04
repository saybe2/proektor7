import { db } from "./db";
import { BIRTHDAY_PUSH } from "./config";
import { sendPushToUser } from "./push";

/**
 * Проверка дней рождения и отправка пушей за 14/7/4 дня.
 * Вызывается по крону (/api/cron/birthday) раз в день.
 */
export async function runBirthdayPushes() {
  const users = await db.user.findMany({
    where: { birthDate: { not: null }, role: "CLIENT" },
    select: { id: true, name: true, birthDate: true },
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let sentCount = 0;

  for (const user of users) {
    const bd = user.birthDate!;
    // ближайший ДР (в этом или следующем году)
    let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < today) {
      next = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate());
    }
    const daysLeft = Math.round(
      (next.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (!(BIRTHDAY_PUSH.DAYS_BEFORE as readonly number[]).includes(daysLeft)) continue;

    const kind = `bday_${daysLeft}`;
    const year = next.getFullYear();

    // не дублируем
    const already = await db.notificationLog.findUnique({
      where: { userId_kind_year: { userId: user.id, kind, year } },
    });
    if (already) continue;

    const { sent } = await sendPushToUser(user.id, {
      title: "Скоро день рождения!",
      body: `${user.name || "Привет"}! Приходи в Proектор отмечать — скидка ${BIRTHDAY_PUSH.DISCOUNT_PERCENT}% при чеке от ${BIRTHDAY_PUSH.MIN_CHECK} ₽!`,
      url: "/",
    });

    await db.notificationLog.create({
      data: { userId: user.id, kind, year },
    });
    sentCount += sent;
  }

  return { sent: sentCount };
}
