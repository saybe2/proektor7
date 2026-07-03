import type { Metadata } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Меню — напитки, снеки, десерты",
  description:
    "Меню тайм-кафе ПРОЕКТОР: кофе, чай, лимонады, снеки и десерты по приятным ценам.",
};

export default async function MenuPage() {
  const items = await db.menuItem.findMany({
    where: { available: true },
    orderBy: [{ category: "asc" }, { sort: "asc" }],
  });

  const byCategory = new Map<string, typeof items>();
  for (const item of items) {
    const list = byCategory.get(item.category) || [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="h-display text-3xl md:text-4xl text-brand-dark text-center mb-3">
        Меню
      </h1>
      <p className="text-center text-[#3c3c6e] mb-10">
        Оплачивай бонусами до 50% чека (при заказе от 500 ₽)
      </p>

      {byCategory.size === 0 && (
        <p className="text-center text-[#3c3c6e]">Меню скоро появится!</p>
      )}

      <div className="space-y-10">
        {[...byCategory.entries()].map(([category, list]) => (
          <section key={category}>
            <h2 className="h-display text-xl text-brand mb-4">{category}</h2>
            <div className="card divide-y divide-[#eef0fa]">
              {list.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <div className="font-bold text-brand-dark">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-[#3c3c6e]">{item.description}</div>
                    )}
                  </div>
                  <div className="font-extrabold text-brand whitespace-nowrap">
                    {item.price} ₽
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
