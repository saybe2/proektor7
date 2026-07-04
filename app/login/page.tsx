import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход и регистрация",
  description:
    "Войдите по номеру телефона и получите 150 бонусов за регистрацию в тайм-кафе Proектор.",
};

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="h-display text-3xl text-brand-dark text-center mb-2">
        Вход / Регистрация
      </h1>
      <p className="text-center text-[#3c3c6e] mb-8">
        Новым гостям — <b>150 бонусов</b> в подарок
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
