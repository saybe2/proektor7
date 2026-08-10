import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, cabinetPath } from "@/lib/auth";
import { dateInputValue } from "@/lib/format";
import PushToggle from "@/app/cabinet/PushToggle";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const cabinetHref = cabinetPath(user.role);

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
