import type { Metadata } from "next";
import { db } from "@/lib/db";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Меню — комбо, горячие закуски и напитки",
  description:
    "Меню тайм-кафе Proектор: комбо-наборы, горячие закуски, авторские лимонады и чай.",
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

      <div className="border-2 border-[#111118] bg-[#ffdd38] px-4 py-3 mb-8 text-sm font-bold text-center">
        Раздел напитков дополняется — скоро добавим остальные позиции.
      </div>

      {byCategory.size === 0 && (
        <p className="text-center text-[#3c3c6e]">Меню скоро появится!</p>
      )}

      <div className="space-y-10">
        {[...byCategory.entries()].map(([category, list]) => (
          <section key={category}>
            <h2 className="h-display text-xl text-brand mb-4">{category}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {list.map((item) => (
                <article key={item.id} className="card overflow-hidden flex flex-col">
                  {item.image && <div className="relative aspect-[16/10] border-b-2 border-[#111118]"><Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /></div>}
                  <div className="flex items-start justify-between gap-4 p-4 flex-1">
                    <div><h3 className="font-bold text-brand-dark">{item.name}</h3>{item.description && <p className="text-sm text-[#3c3c6e] mt-1">{item.description}</p>}</div>
                    <div className="font-extrabold text-brand whitespace-nowrap">{item.price} ₽</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
