"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Item = { href: string; label: string };

export default function MobileMenu({ items, cabinetHref, authenticated }: { items: Item[]; cabinetHref: string; authenticated: boolean }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details ref={detailsRef} className="mobile-menu lg:hidden">
      <summary className="p-2 border-2 border-[#111118] cursor-pointer list-none" aria-label="Открыть меню">
        <span className="mobile-menu-icon block" aria-hidden="true">
          <span className="block w-5 h-0.5 bg-[#111118] mb-1.5" />
          <span className="block w-5 h-0.5 bg-[#111118] mb-1.5" />
          <span className="block w-5 h-0.5 bg-[#111118]" />
        </span>
      </summary>

      <nav id="mobile-navigation" className="absolute left-0 right-0 top-full border-t-2 border-b-2 border-[#111118] bg-[#f5f1e8] px-4 py-5 flex flex-col gap-2 shadow-[0_8px_0_rgba(17,17,24,.14)]">
        {items.map((item) => (
          <Link key={item.href} href={item.href} onClick={closeMenu} className="font-black uppercase tracking-wide py-2 border-b border-[#d8d4ca]">
            {item.label}
          </Link>
        ))}
        <Link href={authenticated ? cabinetHref : "/login"} onClick={closeMenu} className="btn-brand text-center mt-2">
          {authenticated ? "Личный кабинет" : "Войти"}
        </Link>
        {authenticated && <Link href="/settings" onClick={closeMenu} className="btn-outline text-center">Настройки</Link>}
      </nav>
    </details>
  );
}
