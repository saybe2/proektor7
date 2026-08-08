import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import FeedbackForm from "./FeedbackForm";

export const metadata: Metadata = {
  title: "Написать директору",
  description:
    "Жалоба, предложение или благодарность — сообщение уходит лично владельцу тайм-кафе Proектор.",
};

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const user = await getCurrentUser().catch(() => null);

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="h-display text-3xl text-brand-dark text-center mb-2">
        Написать директору
      </h1>
      <p className="text-center text-[#3c3c6e] mb-8">
        Жалоба, предложение или благодарность — сообщение уходит лично владельцу.
      </p>
      <FeedbackForm initialName={user?.name ?? ""} initialPhone={user?.phone ?? ""} />
    </div>
  );
}
