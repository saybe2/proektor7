import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import ContentEditor from "./ContentEditor";

export const dynamic = "force-dynamic";

export default async function OwnerContentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "OWNER") redirect("/");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="h-display text-2xl md:text-3xl text-brand-dark">
          Управление контентом
        </h1>
        <Link href="/owner" className="text-sm font-bold text-brand">
          ← В кабинет
        </Link>
      </div>
      <ContentEditor />
    </div>
  );
}
