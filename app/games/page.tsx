import type { Metadata } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Настольные игры",
  description:
    "Более 100 настольных игр в тайм-кафе ПРОЕКТОР: Мафия, Уно, Монополия, Имаджинариум и другие. Играй сколько хочешь!",
};

export default async function GamesPage() {
  const games = await db.game.findMany({ orderBy: { sort: "asc" } });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="h-display text-3xl md:text-4xl text-brand-dark text-center mb-3">
        🎲 Настольные игры
      </h1>
      <p className="text-center text-[#3c3c6e] mb-10 max-w-2xl mx-auto">
        Играй сколько угодно — все игры включены в стоимость времени.
        Подскажем правила и поможем выбрать игру под компанию!
      </p>

      {games.length === 0 && (
        <p className="text-center text-[#3c3c6e]">Список игр скоро появится!</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <div key={game.id} className="card p-5">
            <div className="font-extrabold text-brand-dark">{game.name}</div>
            {game.players && (
              <div className="text-xs font-bold text-brand mt-0.5">👥 {game.players} игроков</div>
            )}
            {game.description && (
              <p className="text-sm text-[#3c3c6e] mt-2">{game.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
