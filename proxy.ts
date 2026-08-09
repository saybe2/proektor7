import { NextRequest, NextResponse } from "next/server";

// На сайте нет Server Actions — любой POST с заголовком next-action
// это запрос от устаревшей вкладки/PWA после деплоя либо мусор от ботов.
// Отвечаем 404 сразу, чтобы не засорять логи ошибкой "Failed to find Server Action".
export function proxy(req: NextRequest) {
  if (req.method === "POST" && req.headers.has("next-action")) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|sw.js).*)",
};
