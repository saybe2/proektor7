"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const NAV = [
  { href: "/rooms", label: "Комнаты" },
  { href: "/menu", label: "Меню" },
  { href: "/karaoke", label: "Караоке" },
  { href: "/games", label: "Настолки" },
  { href: "/bonus", label: "Бонусы" },
];

type Props = {
  user: { name: string | null; role: string; bonusBalance: number } | null;
};

export default function Header({ user }: Props) {
  const [open, setOpen] = useState(false);

  const cabinetHref =
    user?.role === "OWNER" ? "/owner" : user?.role === "ADMIN" ? "/admin" : "/cabinet";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#e3e6f5]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/img/logo.jpg"
            alt="Тайм-кафе Proектор"
            width={120}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-bold text-[#14143c] hover:text-brand transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link href={cabinetHref} className="btn-brand !py-2 !px-5 text-sm">
              {user.role === "CLIENT" ? (
                <>
                  <span>{user.name || "Кабинет"}</span>
                  <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                    {user.bonusBalance} б.
                  </span>
                </>
              ) : (
                "Панель"
              )}
            </Link>
          ) : (
            <Link href="/login" className="btn-brand !py-2 !px-5 text-sm">
              Войти
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          <div className="w-6 h-0.5 bg-brand mb-1.5" />
          <div className="w-6 h-0.5 bg-brand mb-1.5" />
          <div className="w-6 h-0.5 bg-brand" />
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-[#e3e6f5] bg-white px-4 py-3 flex flex-col gap-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-bold py-1"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={user ? cabinetHref : "/login"}
            className="btn-brand text-center"
            onClick={() => setOpen(false)}
          >
            {user ? "Личный кабинет" : "Войти"}
          </Link>
        </nav>
      )}
    </header>
  );
}
