import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import PushToggle from "@/app/cabinet/PushToggle";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

function dateInputValue(date: Date | null) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const cabinetHref = user.role === "OWNER" ? "/owner" : user.role === "ADMIN" ? "/admin" : "/cabinet";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
      <Link href={cabinetHref} className="font-black text-brand">← Вернуться в кабинет</Link>
      <h1 className="h-display text-4xl md:text-6xl mt-5 mb-3">Настройки</h1>
      <p className="text-[#66656f] mb-8">Исправьте данные профиля и настройте уведомления.</p>
      <div className="space-y-6">
        <ProfileForm initialName={user.name || ""} initialBirthDate={dateInputValue(user.birthDate)} phone={user.phone} />
        <PushToggle alwaysVisible />
      </div>
    </div>
  );
}
