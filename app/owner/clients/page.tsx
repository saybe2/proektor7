import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OwnerClientsPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const owner = await getCurrentUser();
  if (!owner) redirect("/login");
  if (owner.role !== "OWNER") redirect(owner.role === "ADMIN" ? "/admin" : "/cabinet");

  const { client: selectedId } = await searchParams;
  const clients = await db.user.findMany({
    where: { role: "CLIENT" },
    include: { purchases: { select: { amount: true, bonusesSpent: true } }, referrals: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });
  const selected = selectedId
    ? await db.user.findFirst({
        where: { id: selectedId, role: "CLIENT" },
        include: {
          purchases: { include: { admin: { select: { name: true, phone: true } } }, orderBy: { createdAt: "desc" }, take: 50 },
          bonusTransactions: { orderBy: { createdAt: "desc" }, take: 50 },
          referredBy: { select: { name: true, phone: true } },
          referrals: { select: { id: true, name: true, phone: true, createdAt: true } },
        },
      })
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
      <Link href="/owner" className="font-black text-brand">← Кабинет владельца</Link>
      <h1 className="h-display text-4xl md:text-6xl mt-5 mb-8">Клиенты</h1>

      {selected && (
        <section className="card p-5 md:p-7 mb-8">
          <div className="flex flex-wrap justify-between gap-4 border-b-2 border-[#111118] pb-5 mb-5">
            <div><h2 className="h-display text-2xl">{selected.name || "Без имени"}</h2><a className="font-bold text-brand" href={`tel:+${selected.phone}`}>+{selected.phone}</a></div>
            <div className="text-right"><div className="text-3xl font-black text-brand">{selected.bonusBalance}</div><div className="text-xs font-bold">бонусов</div></div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-black mb-3">Последние чеки</h3>
              <div className="space-y-2">
                {selected.purchases.length === 0 && <p className="text-sm text-[#66656f]">Чеков пока нет</p>}
                {selected.purchases.map((purchase) => <div key={purchase.id} className="border-b border-[#d8d4ca] py-2 flex justify-between gap-3 text-sm"><span>{new Date(purchase.createdAt).toLocaleDateString("ru-RU")} · {purchase.admin?.name || purchase.admin?.phone || "Система"}</span><b>{purchase.amount} ₽ · −{purchase.bonusesSpent} б.</b></div>)}
              </div>
            </div>
            <div>
              <h3 className="font-black mb-3">История бонусов</h3>
              <div className="space-y-2">
                {selected.bonusTransactions.map((transaction) => <div key={transaction.id} className="border-b border-[#d8d4ca] py-2 flex justify-between gap-3 text-sm"><span>{transaction.comment || transaction.type}</span><b className={transaction.amount >= 0 ? "text-green-700" : "text-red-600"}>{transaction.amount > 0 ? "+" : ""}{transaction.amount}</b></div>)}
              </div>
            </div>
          </div>
          <div className="mt-6 text-sm"><b>Приглашено друзей:</b> {selected.referrals.length}{selected.referredBy && <> · <b>Пригласил:</b> {selected.referredBy.name || `+${selected.referredBy.phone}`}</>}</div>
        </section>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-[#111118] text-white text-left"><tr><th className="p-3">Клиент</th><th className="p-3">Телефон</th><th className="p-3">Чеков</th><th className="p-3">Выручка</th><th className="p-3">Бонусы</th><th className="p-3">Друзья</th></tr></thead>
          <tbody>{clients.map((client) => {
            const revenue = client.purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
            return <tr key={client.id} className="border-b border-[#d8d4ca] hover:bg-brand-bg"><td className="p-3"><Link href={`/owner/clients?client=${client.id}`} className="font-black text-brand">{client.name || "Без имени"}</Link></td><td className="p-3">+{client.phone}</td><td className="p-3">{client.purchases.length}</td><td className="p-3 font-bold">{revenue} ₽</td><td className="p-3">{client.bonusBalance}</td><td className="p-3">{client.referrals.length}</td></tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  );
}
