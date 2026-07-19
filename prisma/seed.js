// Сид: начальный контент и служебные аккаунты
// Запуск: node prisma/seed.js

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

const ROOM_PRESETS = [
  ["Комната 1", "Уютная отдельная комната для спокойного отдыха и встреч небольшой компанией.", 2, 4, 2],
  ["Комната 2", "Компактное пространство с мягкой зоной для игр, разговоров и просмотра кино.", 2, 6, 2],
  ["Комната 3", "Просторная комната для большой компании, праздника или игрового вечера.", 5, 15, 6],
  ["Комната 4", "Отдельная комната с большим экраном и удобными местами для всей компании.", 2, 6, 4],
  ["Комната 5", "Небольшая приватная комната для встреч с друзьями и настольных игр.", 2, 4, 2],
  ["Комната 6", "Пространство для кино, приставки и отдыха в своей компании.", 4, 8, 3],
  ["Комната 7", "Комфортная комната для хорошего отдыха в кругу друзей.", 2, 5, 5],
  ["Комната 8", "Уютная комната для вечеринки, кино или долгих разговоров.", 2, 5, 3],
  ["Комната 9", "Приватное пространство с мягкими диванами и большим экраном.", 2, 6, 3],
  ["Комната 10", "Отдельная комната для встреч, игр и праздников без посторонних.", 2, 8, 3],
];

const DEFAULT_ROOMS = ROOM_PRESETS.map(([name, description, minCapacity, capacity, imageCount], index) => ({
  name,
  description,
  minCapacity,
  capacity,
  price: 250,
  images: JSON.stringify(Array.from(
    { length: imageCount },
    (_, imageIndex) => `/img/rooms/room-${String(index + 1).padStart(2, "0")}-${String(imageIndex + 1).padStart(2, "0")}.webp`,
  )),
  sort: index + 1,
  active: true,
}));

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
    await db.room.createMany({ data: DEFAULT_ROOMS });
  }
  await db.room.updateMany({ where: { sort: 6 }, data: { minCapacity: 4, capacity: 8 } });
  await db.room.updateMany({ where: { sort: 7 }, data: { description: "Комфортная комната для хорошего отдыха в кругу друзей." } });

  // === Меню ===
  // RESET_MENU=1 заменяет прежнее меню актуальным списком.
  if (process.env.RESET_MENU === "1") {
    await db.menuItem.deleteMany();
  }
  if ((await db.menuItem.count()) === 0) {
    await db.menuItem.createMany({
      data: [
        { category: "Комбо-наборы", name: "Комбо 1", description: "Фри или картофель по-деревенски, луковые кольца, колбаски и 2 соуса", price: 400, sort: 1 },
        { category: "Комбо-наборы", name: "Комбо 2", description: "Фри или картофель по-деревенски, наггетсы, колбаски и 2 соуса", price: 450, sort: 2 },
        { category: "Комбо-наборы", name: "Комбо 3", description: "Стрипсы, колбаски, пельмени и 2 соуса", price: 500, sort: 3 },
        { category: "Комбо-наборы", name: "Комбо 4", description: "Крылья, стрипсы, колбаски и 2 соуса", price: 550, sort: 4 },
        { category: "Комбо-наборы", name: "Комбо 5", description: "Фри или картофель по-деревенски, крылья, луковые кольца и 2 соуса", price: 550, sort: 5 },
        { category: "Наборы", name: "Набор 1", description: "Фри или картофель по-деревенски, наггетсы и соус", price: 300, sort: 1 },
        { category: "Наборы", name: "Набор 2", description: "Фри или картофель по-деревенски, стрипсы и соус", price: 350, sort: 2 },
        { category: "Наборы", name: "Набор 3", description: "Фри или картофель по-деревенски, крылья и соус", price: 350, sort: 3 },
        { category: "По отдельности", name: "Фри / картофель по-деревенски", price: 150, sort: 1 },
        { category: "По отдельности", name: "Пельмени", price: 300, sort: 2 },
        { category: "По отдельности", name: "Креветки", price: 300, sort: 3 },
        { category: "По отдельности", name: "Соус", price: 80, sort: 4 },
        { category: "Напитки", name: "Авторские лимонады", description: "Клубничный, ягодный или цитрусовый", price: 700, sort: 1 },
        { category: "Напитки", name: "Авторский чай", price: 700, sort: 2 },
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
