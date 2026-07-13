import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PERIODS = { week: 7, month: 30, quarter: 90, year: 365 } as const;

export default async function RevenuePage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const owner = await getCurrentUser();
  if (!owner) redirect("/login");
  if (owner.role !== "OWNER") redirect(owner.role === "ADMIN" ? "/admin" : "/cabinet");
  const params = await searchParams;
  const period = params.period && params.period in PERIODS ? params.period as keyof typeof PERIODS : "month";
  const since = new Date();
  since.setDate(since.getDate() - PERIODS[period]);
  const purchases = await db.purchase.findMany({ where: { createdAt: { gte: since } }, include: { user: { select: { id: true, name: true, phone: true } }, admin: { select: { name: true, phone: true } } }, orderBy: { createdAt: "desc" } });
  const revenue = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const bonuses = purchases.reduce((sum, purchase) => sum + purchase.bonusesSpent, 0);

  return <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
    <Link href="/owner" className="font-black text-brand">← Кабинет владельца</Link>
    <h1 className="h-display text-4xl md:text-6xl mt-5 mb-7">Выручка</h1>
    <div className="flex gap-2 overflow-x-auto pb-3 mb-5">{Object.keys(PERIODS).map((key) => <Link key={key} href={`/owner/revenue?period=${key}`} className={period === key ? "btn-brand !min-h-0 !py-2" : "btn-outline !min-h-0 !py-2"}>{({ week: "7 дней", month: "30 дней", quarter: "90 дней", year: "Год" } as Record<string,string>)[key]}</Link>)}</div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-7"><div className="card p-5"><div className="text-3xl font-black text-brand">{revenue} ₽</div><div className="text-xs font-bold">сумма чеков</div></div><div className="card p-5"><div className="text-3xl font-black text-brand">{purchases.length}</div><div className="text-xs font-bold">чеков</div></div><div className="card p-5"><div className="text-3xl font-black text-brand">{bonuses}</div><div className="text-xs font-bold">бонусов списано</div></div></div>
    <div className="card overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-[#111118] text-white text-left"><tr><th className="p-3">Дата</th><th className="p-3">Клиент</th><th className="p-3">Сумма</th><th className="p-3">Бонусы</th><th className="p-3">Провёл</th></tr></thead><tbody>{purchases.map((purchase) => <tr key={purchase.id} className="border-b border-[#d8d4ca]"><td className="p-3">{new Date(purchase.createdAt).toLocaleString("ru-RU")}</td><td className="p-3"><Link className="font-bold text-brand" href={`/owner/clients?client=${purchase.user.id}`}>{purchase.user.name || `+${purchase.user.phone}`}</Link></td><td className="p-3 font-black">{purchase.amount} ₽</td><td className="p-3">{purchase.bonusesSpent}</td><td className="p-3">{purchase.admin?.name || purchase.admin?.phone || "Система"}</td></tr>)}</tbody></table></div>
  </div>;
}
