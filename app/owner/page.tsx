import Link from "next/link";
import { db } from "@/lib/db";
import { requireOwnerPage } from "@/lib/auth";
import LogoutButton from "../cabinet/LogoutButton";
import BroadcastForm from "./BroadcastForm";
import PendingConfirmations from "./PendingConfirmations";
import BusinessHoursForm from "./BusinessHoursForm";
import { getBusinessHours } from "@/lib/business-hours";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  await requireOwnerPage();
  const hours = await getBusinessHours();

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
    db.user.count({ where: { role: "CLIENT", isGuest: false } }),
    db.user.count({ where: { role: "CLIENT", isGuest: false, createdAt: { gt: monthAgo } } }),
    db.purchase.count({ where: { createdAt: { gt: monthAgo } } }),
    db.purchase.aggregate({
      where: { createdAt: { gt: monthAgo } },
      _sum: { amount: true },
    }),
    db.bonusTransaction.aggregate({
      where: { amount: { gt: 0 }, status: "CONFIRMED" },
      _sum: { amount: true },
    }),
    db.bonusTransaction.aggregate({
      where: { type: "REDEEM", status: "CONFIRMED" },
      _sum: { amount: true },
    }),
    db.pushSubscription.count(),
  ]);

  const unreadFeedback = await db.feedback.count({ where: { isRead: false } });

  const [pendingPurchases, pendingWelcomes] = await Promise.all([
    db.purchase.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { name: true, phone: true, isGuest: true } },
        bonusTransactions: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.bonusTransaction.findMany({
      where: { type: "WELCOME", status: "PENDING" },
      include: { user: { select: { id: true, name: true, phone: true, isGuest: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const stats = [
    { label: "Ожидают подтверждения", value: pendingPurchases.length + pendingWelcomes.length },
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
      <Link href="/settings" className="btn-outline w-full mb-6">Настройки профиля и уведомлений</Link>

      {/* Статистика */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl font-black text-brand">{s.value}</div>
            <div className="text-xs font-semibold text-[#3c3c6e] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Заявки на подтверждение */}
      {(pendingPurchases.length > 0 || pendingWelcomes.length > 0) && (
        <PendingConfirmations
          pendingPurchases={pendingPurchases.map((p) => ({
            id: p.id,
            amount: p.amount,
            bonusesSpent: p.bonusesSpent,
            createdAt: p.createdAt.toISOString(),
            clientName: p.user.name || (p.user.isGuest ? "Гость" : "Клиент"),
            clientPhone: p.user.phone,
            isGuest: p.user.isGuest,
            cashback: p.bonusTransactions
              .filter((t) => t.type === "CASHBACK")
              .reduce((sum, t) => sum + t.amount, 0),
            referralBonus: p.bonusTransactions
              .filter((t) => t.type === "REFERRAL")
              .reduce((sum, t) => sum + t.amount, 0),
          }))}
          pendingWelcomes={pendingWelcomes.map((w) => ({
            userId: w.user.id,
            name: w.user.name || "Клиент",
            phone: w.user.phone,
            // время самой заявки: у бывшего гостя запись создана раньше регистрации
            createdAt: w.createdAt.toISOString(),
          }))}
        />
      )}

      {/* Касса тоже доступна владельцу */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card p-6 flex items-center justify-between gap-4"><div><div className="font-extrabold text-brand-dark">База клиентов</div><p className="text-sm text-[#3c3c6e]">Телефоны, чеки, бонусы и приглашённые друзья</p></div><Link href="/owner/clients" className="btn-brand !py-2 !px-4 text-sm shrink-0">Открыть</Link></div>
        <div className="card p-6 flex items-center justify-between gap-4"><div><div className="font-extrabold text-brand-dark">Подробная выручка</div><p className="text-sm text-[#3c3c6e]">Чеки по периодам, клиентам и администраторам</p></div><Link href="/owner/revenue" className="btn-brand !py-2 !px-4 text-sm shrink-0">Открыть</Link></div>
      </div>

      <div className="card p-6 mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="font-extrabold text-brand-dark">Сообщения директору</div>
          <p className="text-sm text-[#3c3c6e]">Жалобы и предложения со страницы обратной связи{unreadFeedback > 0 ? ` · непрочитанных: ${unreadFeedback}` : ""}</p>
        </div>
        <Link href="/owner/feedback" className="btn-brand !py-2 !px-5 text-sm shrink-0">
          Открыть
        </Link>
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
      <BusinessHoursForm initial={hours} />
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
