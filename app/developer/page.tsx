import Link from "next/link";
import { requireDeveloperPage } from "@/lib/auth";
import DeveloperPanel from "./DeveloperPanel";

export const dynamic = "force-dynamic";
export default async function DeveloperPage() {
  const user = await requireDeveloperPage();
  return <div className="max-w-5xl mx-auto px-4 py-12">
    <h1 className="h-display text-3xl mb-6">Разработчик</h1>
    <div className="flex flex-wrap gap-3 mb-8"><Link className="btn-outline" href="/owner">Кабинет владельца</Link><Link className="btn-outline" href="/admin">Касса</Link><Link className="btn-outline" href="/settings">Профиль</Link></div>
    <DeveloperPanel currentUserId={user.id} />
  </div>;
}
