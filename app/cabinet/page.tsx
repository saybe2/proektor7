import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, cabinetPath } from "@/lib/auth";
import { AUTO_CONFIRM_HOURS, BONUS } from "@/lib/config";
import { formatDate } from "@/lib/format";
import RefLinkCard from "./RefLinkCard";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  WELCOME: "Приветственные",
  CASHBACK: "Кэшбэк",
  REFERRAL: "За друга",
  REDEEM: "Оплата бонусами",
  MANUAL: "Корректировка",
};

export default async function CabinetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLIENT") redirect(cabinetPath(user.role));

  const [transactions, pendingTransactions, referralsCount] = await Promise.all([
    db.bonusTransaction.findMany({
      where: { userId: user.id, status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.bonusTransaction.findMany({
      where: { userId: user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where: { referredById: user.id } }),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="h-display text-2xl md:text-3xl text-brand-dark">
          Привет{user.name ? `, ${user.name}` : ""}!
        </h1>
        <LogoutButton />
      </div>

      {/* Баланс */}
      <div className="card !bg-[#2020c7] !border-[#111118] text-white p-8 text-center mb-6">
        <div className="text-[#dadaff] font-semibold">Твои бонусы</div>
        <div className="text-5xl font-black my-2 text-white">{user.bonusBalance}</div>
        <div className="text-[#dadaff] text-sm">
          1 бонус = 1 ₽ · оплата до {BONUS.MAX_REDEEM_PERCENT}% чека (от {BONUS.MIN_CHECK_FOR_REDEEM} ₽)
        </div>
      </div>

      {/* Ожидающие подтверждения */}
      {pendingTransactions.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-extrabold text-lg text-brand-dark mb-4">
            Ожидают подтверждения владельцем
          </h2>
          <div className="divide-y divide-[#eef0fa]">
            {pendingTransactions.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-brand-dark">
                    {TYPE_LABELS[t.type] || t.type}
                  </div>
                  {t.comment && <div className="text-xs text-[#3c3c6e]">{t.comment}</div>}
                  <div className="text-xs text-[#9aa0c0]">
                    {formatDate(t.createdAt)}
                  </div>
                </div>
                <div className="font-extrabold text-[#9aa0c0]">
                  {t.amount > 0 ? "+" : "−"}{Math.abs(t.amount)}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9aa0c0] mt-4">
            Бонусы появятся на балансе после подтверждения владельцем или автоматически через {AUTO_CONFIRM_HOURS} часов — придёт уведомление.
          </p>
        </div>
      )}

      {/* Реферальная ссылка */}
      <RefLinkCard refCode={user.refCode} referralsCount={referralsCount} />

      {/* История */}
      <div className="card p-6 mt-6">
        <h2 className="font-extrabold text-lg text-brand-dark mb-4">История бонусов</h2>
        {transactions.length === 0 && (
          <p className="text-[#3c3c6e] text-sm">Пока пусто — приходи в гости!</p>
        )}
        <div className="divide-y divide-[#eef0fa]">
          {transactions.map((t) => (
            <div key={t.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-sm text-brand-dark">
                  {TYPE_LABELS[t.type] || t.type}
                </div>
                {t.comment && <div className="text-xs text-[#3c3c6e]">{t.comment}</div>}
                <div className="text-xs text-[#9aa0c0]">
                  {formatDate(t.createdAt)}
                </div>
              </div>
              <div className={`font-extrabold ${t.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                {t.amount > 0 ? "+" : ""}{t.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
