import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "../cabinet/LogoutButton";
import BroadcastForm from "./BroadcastForm";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "OWNER") redirect(user.role === "ADMIN" ? "/admin" : "/cabinet");

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [
    clientsTotal,
    clientsMonth,
    purchasesMonth,
    revenueMonth,
    bonusesIssued,
    bonusesSpent,
    pushSubs,
  ] = await Promise.all([
    db.user.count({ where: { role: "CLIENT" } }),
    db.user.count({ where: { role: "CLIENT", createdAt: { gt: monthAgo } } }),
    db.purchase.count({ where: { createdAt: { gt: monthAgo } } }),
    db.purchase.aggregate({
      where: { createdAt: { gt: monthAgo } },
      _sum: { amount: true },
    }),
    db.bonusTransaction.aggregate({
      where: { amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    db.bonusTransaction.aggregate({
      where: { type: "REDEEM" },
      _sum: { amount: true },
    }),
    db.pushSubscription.count(),
  ]);

  const stats = [
    { label: "Клиентов всего", value: clientsTotal },
    { label: "Новых за 30 дней", value: clientsMonth },
    { label: "Чеков за 30 дней", value: purchasesMonth },
    { label: "Выручка за 30 дней", value: `${revenueMonth._sum.amount || 0} ₽` },
    { label: "Бонусов начислено", value: bonusesIssued._sum.amount || 0 },
    { label: "Бонусов списано", value: Math.abs(bonusesSpent._sum.amount || 0) },
    { label: "Подписок на пуши", value: pushSubs },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="h-display text-2xl md:text-3xl text-brand-dark">
          Кабинет владельца
        </h1>
        <LogoutButton />
      </div>

      {/* Статистика */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl font-black text-brand">{s.value}</div>
            <div className="text-xs font-semibold text-[#3c3c6e] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Касса тоже доступна владельцу */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card p-6 flex items-center justify-between gap-4"><div><div className="font-extrabold text-brand-dark">База клиентов</div><p className="text-sm text-[#3c3c6e]">Телефоны, чеки, бонусы и приглашённые друзья</p></div><Link href="/owner/clients" className="btn-brand !py-2 !px-4 text-sm shrink-0">Открыть</Link></div>
        <div className="card p-6 flex items-center justify-between gap-4"><div><div className="font-extrabold text-brand-dark">Подробная выручка</div><p className="text-sm text-[#3c3c6e]">Чеки по периодам, клиентам и администраторам</p></div><Link href="/owner/revenue" className="btn-brand !py-2 !px-4 text-sm shrink-0">Открыть</Link></div>
      </div>

      <div className="card p-6 mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="font-extrabold text-brand-dark">Касса</div>
          <p className="text-sm text-[#3c3c6e]">Провести чек, списать/начислить бонусы</p>
        </div>
        <Link href="/admin" className="btn-brand !py-2 !px-5 text-sm shrink-0">
          Открыть
        </Link>
      </div>

      {/* Контент */}
      <div className="card p-6 mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="font-extrabold text-brand-dark">Контент сайта</div>
          <p className="text-sm text-[#3c3c6e]">Комнаты с фото, меню, настольные игры</p>
        </div>
        <Link href="/owner/content" className="btn-brand !py-2 !px-5 text-sm shrink-0">
          Редактировать
        </Link>
      </div>

      {/* Рассылка пушей */}
      <BroadcastForm />
    </div>
  );
}
