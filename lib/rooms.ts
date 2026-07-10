import { PRICES } from "./config";

type RoomPreset = {
  name: string;
  description: string;
  capacity: number;
  imageCount: number;
};

const ROOM_PRESETS: RoomPreset[] = [
  { name: "Комната 1", description: "Уютная отдельная комната для спокойного отдыха и встреч небольшой компанией.", capacity: 6, imageCount: 2 },
  { name: "Комната 2", description: "Компактное пространство с мягкой зоной для игр, разговоров и просмотра кино.", capacity: 6, imageCount: 2 },
  { name: "Комната 3", description: "Просторная комната для большой компании, праздника или игрового вечера.", capacity: 10, imageCount: 6 },
  { name: "Комната 4", description: "Отдельная комната с большим экраном и удобными местами для всей компании.", capacity: 8, imageCount: 4 },
  { name: "Комната 5", description: "Небольшая приватная комната для встреч с друзьями и настольных игр.", capacity: 6, imageCount: 2 },
  { name: "Комната 6", description: "Пространство для кино, приставки и отдыха в своей компании.", capacity: 8, imageCount: 3 },
  { name: "Комната 7", description: "Большая комната с несколькими зонами для праздников и компаний.", capacity: 12, imageCount: 5 },
  { name: "Комната 8", description: "Уютная комната для вечеринки, кино или долгих разговоров.", capacity: 8, imageCount: 3 },
  { name: "Комната 9", description: "Приватное пространство с мягкими диванами и большим экраном.", capacity: 8, imageCount: 3 },
  { name: "Комната 10", description: "Отдельная комната для встреч, игр и праздников без посторонних.", capacity: 10, imageCount: 3 },
];

function roomImages(roomNumber: number, imageCount: number) {
  return Array.from(
    { length: imageCount },
    (_, index) => `/img/rooms/room-${String(roomNumber).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}.webp`,
  );
}

export const DEFAULT_ROOMS = ROOM_PRESETS.map((room, index) => ({
  id: `room-${index + 1}`,
  name: room.name,
  description: room.description,
  capacity: room.capacity,
  price: PRICES.ROOM_PER_PERSON,
  images: JSON.stringify(roomImages(index + 1, room.imageCount)),
  sort: index + 1,
  active: true,
}));
