"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client-api";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    // даже если запрос не дошёл, уводим со страницы кабинета:
    // серверный рендер сам решит, есть ли ещё сессия
    await postJson("/api/auth/logout", {});
    router.push("/");
    router.refresh();
  }

  return (
    <button
      className="text-sm font-bold text-[#9aa0c0] hover:text-red-500 disabled:opacity-60"
      disabled={busy}
      onClick={() => void logout()}
    >
      {busy ? "Выходим..." : "Выйти"}
    </button>
  );
}
