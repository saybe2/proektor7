import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";
import MobileDock from "@/components/MobileDock";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.URL),
  title: {
    default: `${SITE.NAME} — караоке, настольные игры, комнаты с проектором`,
    template: `%s — ${SITE.NAME}`,
  },
  description: SITE.DESCRIPTION,
  keywords: [
    "тайм-кафе",
    "антикафе",
    "Набережные Челны",
    "караоке Набережные Челны",
    "настольные игры",
    "проектор",
    "день рождения",
    "аренда комнаты",
    "антикафе Челны",
  ],
  openGraph: {
    title: SITE.NAME,
    description: SITE.DESCRIPTION,
    url: SITE.URL,
    siteName: SITE.NAME,
    locale: "ru_RU",
    type: "website",
    images: ["/img/logo.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="ru" className={`${manrope.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col">
        <Header
          user={user ? { name: user.name, role: user.role, bonusBalance: user.bonusBalance } : null}
        />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileDock />
      </body>
    </html>
  );
}
