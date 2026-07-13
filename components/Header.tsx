import Link from "next/link";
import Image from "next/image";
import MobileMenu from "@/components/MobileMenu";

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
  const cabinetHref =
    user?.role === "OWNER" ? "/owner" : user?.role === "ADMIN" ? "/admin" : "/cabinet";

  return (
    <header className="sticky top-0 z-50 bg-[#f5f1e8]/95 backdrop-blur border-b-2 border-[#111118]">
      <div className="max-w-7xl mx-auto px-4 h-[68px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/img/logo.jpg"
            alt="Тайм-кафе Proектор"
            width={120}
            height={48}
            className="h-11 w-auto object-contain mix-blend-multiply"
            priority
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-black uppercase tracking-wider hover:text-brand transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
            <Link href="/settings" className="text-xs font-black uppercase tracking-wider hover:text-brand">Настройки</Link>
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
            </>
          ) : (
            <Link href="/login" className="btn-brand !min-h-0 !py-2 !px-5 text-sm !shadow-[3px_3px_0_#111118]">
              150 бонусов
            </Link>
          )}
        </div>

        <MobileMenu items={NAV} cabinetHref={cabinetHref} authenticated={Boolean(user)} />
      </div>
    </header>
  );
}
