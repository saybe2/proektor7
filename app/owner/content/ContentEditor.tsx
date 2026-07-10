"use client";

import { useCallback, useEffect, useState } from "react";

type Entity = "room" | "menu" | "game";

type Room = {
  id: string; name: string; description: string; capacity: number;
  minCapacity: number; price: number; images: string; sort: number; active: boolean;
};
type MenuItem = {
  id: string; category: string; name: string; description: string;
  price: number; sort: number; available: boolean;
};
type Game = {
  id: string; name: string; description: string; players: string; sort: number;
};

const TABS: { key: Entity; label: string }[] = [
  { key: "room", label: "Комнаты" },
  { key: "menu", label: "Меню" },
  { key: "game", label: "Игры" },
];

export default function ContentEditor() {
  const [tab, setTab] = useState<Entity>("room");

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={t.key === tab ? "btn-brand !py-2 !px-4 text-sm" : "btn-outline !py-2 !px-4 text-sm"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "room" && <RoomsTab />}
      {tab === "menu" && <MenuTab />}
      {tab === "game" && <GamesTab />}
    </div>
  );
}

function useItems<T>(entity: Entity) {
  const [items, setItems] = useState<T[]>([]);
  const reload = useCallback(async () => {
    const res = await fetch(`/api/owner/content?entity=${entity}`);
    const data = await res.json();
    if (data.ok) setItems(data.items);
  }, [entity]);
  useEffect(() => {
    let active = true;
    fetch(`/api/owner/content?entity=${entity}`)
      .then((res) => res.json())
      .then((data) => { if (active && data.ok) setItems(data.items); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [entity]);
  return { items, reload };
}

async function saveItem(entity: Entity, data: unknown, id?: string) {
  const res = await fetch(`/api/owner/content?entity=${entity}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, data }),
  });
  return res.json();
}

async function deleteItem(entity: Entity, id: string) {
  if (!confirm("Удалить?")) return false;
  await fetch(`/api/owner/content?entity=${entity}&id=${id}`, { method: "DELETE" });
  return true;
}

async function uploadPhoto(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/owner/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!data.ok) {
    alert(data.error || "Ошибка загрузки");
    return null;
  }
  return data.url;
}

/* ==================== КОМНАТЫ ==================== */

function RoomsTab() {
  const { items, reload } = useItems<Room>("room");
  const [editing, setEditing] = useState<Partial<Room> | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function startEdit(room?: Room) {
    setEditing(room || { name: "", description: "", minCapacity: 2, capacity: 4, price: 250, sort: 0, active: true });
    setImages(room ? JSON.parse(room.images) : []);
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      const result = await saveItem("room", {
        name: editing.name,
        description: editing.description || "",
        minCapacity: Number(editing.minCapacity) || 1,
        capacity: Number(editing.capacity) || 1,
        price: Number(editing.price) || 0,
        sort: Number(editing.sort) || 0,
        active: editing.active ?? true,
        images,
      }, editing.id);
      if (!result.ok) { alert(result.error); return; }
      setEditing(null);
      reload();
    } finally { setBusy(false); }
  }

  if (editing) {
    return (
      <div className="card p-6 space-y-4">
        <h2 className="font-extrabold text-lg text-brand-dark">
          {editing.id ? "Редактировать комнату" : "Новая комната"}
        </h2>
        <div>
          <label className="label">Название</label>
          <input className="input" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Описание</label>
          <textarea className="input min-h-24" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Минимум гостей</label>
            <input className="input" type="number" value={editing.minCapacity ?? ""} onChange={(e) => setEditing({ ...editing, minCapacity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Максимум гостей</label>
            <input className="input" type="number" value={editing.capacity ?? ""} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">₽/час с чел.</label>
            <input className="input" type="number" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Порядок</label>
            <input className="input" type="number" value={editing.sort ?? 0} onChange={(e) => setEditing({ ...editing, sort: Number(e.target.value) })} />
          </div>
        </div>

        {/* Фото */}
        <div>
          <label className="label">Фотографии</label>
          <div className="flex flex-wrap gap-3">
            {images.map((src, i) => (
              <div key={src} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-24 w-36 object-cover rounded-lg" />
                <button
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                >x</button>
              </div>
            ))}
            <label className="h-24 w-36 border-2 border-dashed border-[#d9ddf2] rounded-lg flex items-center justify-center cursor-pointer text-brand font-bold text-sm hover:border-brand">
              + Фото
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadPhoto(file);
                  if (url) setImages([...images, url]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        <label className="flex items-center gap-2 font-semibold text-sm">
          <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
          Показывать на сайте
        </label>

        <div className="flex gap-2">
          <button className="btn-brand" onClick={save} disabled={busy || !editing.name}>
            {busy ? "Сохраняем..." : "Сохранить"}
          </button>
          <button className="btn-outline" onClick={() => setEditing(null)}>Отмена</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button className="btn-brand" onClick={() => startEdit()}>+ Добавить комнату</button>
      {items.map((room) => (
        <div key={room.id} className="card p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-brand-dark">
              {room.name} {!room.active && <span className="text-xs text-red-500">(скрыта)</span>}
            </div>
            <div className="text-sm text-[#3c3c6e]">
              {room.price} ₽/час с чел. · от {room.minCapacity} до {room.capacity} чел · фото: {JSON.parse(room.images).length}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="btn-outline !py-1.5 !px-3 text-sm" onClick={() => startEdit(room)}>Изменить</button>
            <button className="text-red-500 font-bold text-sm px-2" onClick={async () => { if (await deleteItem("room", room.id)) reload(); }}>Удалить</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==================== МЕНЮ ==================== */

function MenuTab() {
  const { items, reload } = useItems<MenuItem>("menu");
  const [editing, setEditing] = useState<Partial<MenuItem> | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      const result = await saveItem("menu", {
        category: editing.category,
        name: editing.name,
        description: editing.description || "",
        price: Number(editing.price) || 0,
        sort: Number(editing.sort) || 0,
        available: editing.available ?? true,
      }, editing.id);
      if (!result.ok) { alert(result.error); return; }
      setEditing(null);
      reload();
    } finally { setBusy(false); }
  }

  if (editing) {
    return (
      <div className="card p-6 space-y-4">
        <h2 className="font-extrabold text-lg text-brand-dark">
          {editing.id ? "Редактировать позицию" : "Новая позиция"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Категория</label>
            <input className="input" value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Напитки" />
          </div>
          <div>
            <label className="label">Название</label>
            <input className="input" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Описание</label>
          <input className="input" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Цена, ₽</label>
            <input className="input" type="number" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Порядок</label>
            <input className="input" type="number" value={editing.sort ?? 0} onChange={(e) => setEditing({ ...editing, sort: Number(e.target.value) })} />
          </div>
        </div>
        <label className="flex items-center gap-2 font-semibold text-sm">
          <input type="checkbox" checked={editing.available ?? true} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} />
          В наличии
        </label>
        <div className="flex gap-2">
          <button className="btn-brand" onClick={save} disabled={busy || !editing.name || !editing.category}>
            {busy ? "Сохраняем..." : "Сохранить"}
          </button>
          <button className="btn-outline" onClick={() => setEditing(null)}>Отмена</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button className="btn-brand" onClick={() => setEditing({ category: "", name: "", price: 0, sort: 0, available: true })}>
        + Добавить позицию
      </button>
      {items.map((item) => (
        <div key={item.id} className="card p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-brand-dark">
              {item.name} {!item.available && <span className="text-xs text-red-500">(нет)</span>}
            </div>
            <div className="text-sm text-[#3c3c6e]">{item.category} · {item.price} ₽</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="btn-outline !py-1.5 !px-3 text-sm" onClick={() => setEditing(item)}>Изменить</button>
            <button className="text-red-500 font-bold text-sm px-2" onClick={async () => { if (await deleteItem("menu", item.id)) reload(); }}>Удалить</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==================== ИГРЫ ==================== */

function GamesTab() {
  const { items, reload } = useItems<Game>("game");
  const [editing, setEditing] = useState<Partial<Game> | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      const result = await saveItem("game", {
        name: editing.name,
        description: editing.description || "",
        players: editing.players || "",
        sort: Number(editing.sort) || 0,
      }, editing.id);
      if (!result.ok) { alert(result.error); return; }
      setEditing(null);
      reload();
    } finally { setBusy(false); }
  }

  if (editing) {
    return (
      <div className="card p-6 space-y-4">
        <h2 className="font-extrabold text-lg text-brand-dark">
          {editing.id ? "Редактировать игру" : "Новая игра"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Название</label>
            <input className="input" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Игроки</label>
            <input className="input" value={editing.players || ""} onChange={(e) => setEditing({ ...editing, players: e.target.value })} placeholder="2-6" />
          </div>
        </div>
        <div>
          <label className="label">Описание</label>
          <input className="input" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button className="btn-brand" onClick={save} disabled={busy || !editing.name}>
            {busy ? "Сохраняем..." : "Сохранить"}
          </button>
          <button className="btn-outline" onClick={() => setEditing(null)}>Отмена</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button className="btn-brand" onClick={() => setEditing({ name: "", players: "", sort: 0 })}>
        + Добавить игру
      </button>
      {items.map((game) => (
        <div key={game.id} className="card p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-brand-dark">{game.name}</div>
            <div className="text-sm text-[#3c3c6e]">{game.players && `${game.players} игроков · `}{game.description}</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="btn-outline !py-1.5 !px-3 text-sm" onClick={() => setEditing(game)}>Изменить</button>
            <button className="text-red-500 font-bold text-sm px-2" onClick={async () => { if (await deleteItem("game", game.id)) reload(); }}>Удалить</button>
          </div>
        </div>
      ))}
    </div>
  );
}
