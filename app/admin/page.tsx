import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminPanel from "./AdminPanel";
import LogoutButton from "../cabinet/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "OWNER") redirect("/cabinet");

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="h-display text-2xl md:text-3xl text-brand-dark">
          Касса · {user.name || "Админ"}
        </h1>
        <LogoutButton />
      </div>
      <AdminPanel />
    </div>
  );
}
