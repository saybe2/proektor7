// Сид: начальный контент и служебные аккаунты
// Запуск: node prisma/seed.js

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

function refCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

async function main() {
  // === Служебные аккаунты (номера ЗАМЕНИТЬ на реальные!) ===
  const OWNER_PHONE = process.env.OWNER_PHONE || "79000000001";
  const ADMIN_PHONE = process.env.ADMIN_PHONE || "79000000002";

  await db.user.upsert({
    where: { phone: OWNER_PHONE },
    update: { role: "OWNER" },
    create: { phone: OWNER_PHONE, name: "Владелец", role: "OWNER", refCode: refCode() },
  });
  await db.user.upsert({
    where: { phone: ADMIN_PHONE },
    update: { role: "ADMIN" },
    create: { phone: ADMIN_PHONE, name: "Администратор", role: "ADMIN", refCode: refCode() },
  });

  // === Комнаты ===
  if ((await db.room.count()) === 0) {
    await db.room.createMany({
      data: [
        {
          name: "Кинозал «Классика»",
          description:
            "Просторная комната с большим проектором, мягкими диванами и караоке. Идеальна для кино-вечера или дня рождения.",
          capacity: 10,
          price: 250,
          sort: 1,
        },
        {
          name: "Игровая «Консоль»",
          description:
            "PlayStation 5, два геймпада, проектор и удобные кресла-мешки. FIFA, Mortal Kombat и не только.",
          capacity: 6,
          price: 250,
          sort: 2,
        },
        {
          name: "Уютная «Ламповая»",
          description:
            "Небольшая комната для компании друзей: настолки, чай и тёплая атмосфера.",
          capacity: 4,
          price: 250,
          sort: 3,
        },
      ],
    });
  }

  // === Меню ===
  if ((await db.menuItem.count()) === 0) {
    await db.menuItem.createMany({
      data: [
        { category: "Напитки", name: "Чай в ассортименте", description: "Чёрный, зелёный, фруктовый", price: 100, sort: 1 },
        { category: "Напитки", name: "Кофе американо", price: 120, sort: 2 },
        { category: "Напитки", name: "Капучино", price: 150, sort: 3 },
        { category: "Напитки", name: "Лимонад домашний", price: 180, sort: 4 },
        { category: "Снеки", name: "Попкорн", description: "Солёный или сладкий", price: 150, sort: 1 },
        { category: "Снеки", name: "Начос с соусом", price: 200, sort: 2 },
        { category: "Снеки", name: "Пицца маргарита", price: 450, sort: 3 },
        { category: "Десерты", name: "Чизкейк", price: 220, sort: 1 },
        { category: "Десерты", name: "Мороженое", description: "3 шарика на выбор", price: 180, sort: 2 },
      ],
    });
  }

  // === Настольные игры ===
  if ((await db.game.count()) === 0) {
    await db.game.createMany({
      data: [
        { name: "Мафия", players: "6-20", description: "Классика для большой компании", sort: 1 },
        { name: "Уно", players: "2-10", description: "Быстрая карточная игра", sort: 2 },
        { name: "Монополия", players: "2-6", description: "Экономическая стратегия", sort: 3 },
        { name: "Имаджинариум", players: "4-7", description: "Игра ассоциаций с красивыми картами", sort: 4 },
        { name: "Дженга", players: "2-8", description: "Башня на ловкость", sort: 5 },
        { name: "Экивоки", players: "4-16", description: "Объясняй слова как угодно", sort: 6 },
        { name: "Каркассон", players: "2-5", description: "Строим средневековую Францию", sort: 7 },
        { name: "Alias", players: "4-12", description: "Объясни слово за минуту", sort: 8 },
      ],
    });
  }

  console.log("Сид выполнен: аккаунты владельца/админа, комнаты, меню, игры.");
  console.log(`Владелец: +${OWNER_PHONE}, Админ: +${ADMIN_PHONE}`);
}

main().finally(() => db.$disconnect());
