import { db } from "@/lib/db";
export default async function SiteAnnouncement() {
  const settings = await db.siteSetting.findMany({ where: { key: { in: ["announcement", "announcementEnabled"] } } });
  const text = settings.find(s => s.key === "announcement")?.value;
  if (!text || settings.find(s => s.key === "announcementEnabled")?.value !== "true") return null;
  return <aside className="bg-[#ffdd38] text-[#111118] px-4 py-3 text-center font-bold" role="status">{text}</aside>;
}
