import Link from "next/link";
import { db } from "@/lib/db";
import { requireOwnerPage } from "@/lib/auth";
import FeedbackList from "./FeedbackList";

export const dynamic = "force-dynamic";

export default async function OwnerFeedbackPage() {
  await requireOwnerPage();

  const feedbacks = await db.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { phone: true, name: true } } },
  });
  const unread = feedbacks.filter((f) => !f.isRead).length;

  const items = feedbacks.map((f) => ({
    id: f.id,
    createdAt: f.createdAt.toISOString(),
    name: f.name || f.user?.name || null,
    phone: f.phone || f.user?.phone || null,
    message: f.message,
    isRead: f.isRead,
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
      <Link href="/owner" className="font-black text-brand">← Кабинет владельца</Link>
      <h1 className="h-display text-4xl md:text-6xl mt-5 mb-2">Сообщения директору</h1>
      <p className="text-[#3c3c6e] mb-8">Непрочитанных: <b>{unread}</b></p>
      <FeedbackList items={items} />
    </div>
  );
}
