import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { cabinetPath } from "./routes";
import type { Role } from "@prisma/client";
import { isOwnerRole, isStaffRole } from "./roles";

export { cabinetPath };

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  // Секрет проверяем всегда, а не только при NODE_ENV=production: иначе
  // прод-сборка с неверным NODE_ENV подписывала бы сессии публичной строкой.
  if (!secret || secret.length < 32 || secret.includes("ЗАМЕНИТЬ")) {
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}
const COOKIE_NAME = "proektor_session";
const SESSION_DAYS = 90;

function shouldUseSecureCookie() {
  if (process.env.AUTH_COOKIE_SECURE === "false") return false;
  if (process.env.AUTH_COOKIE_SECURE === "true") return true;
  return process.env.NODE_ENV === "production";
}

export type SessionPayload = {
  userId: string;
  role: Role;
};

export async function createSession(userId: string, role: Role) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** Текущий пользователь из БД (или null) */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.userId } });
}

/** Требует роль ADMIN или OWNER, иначе кидает ошибку */
export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireOwner() {
  const user = await getCurrentUser();
  if (!user || !isOwnerRole(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/** Нормализация телефона к виду 79XXXXXXXXX */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let p = digits;
  if (p.length === 10 && p.startsWith("9")) p = "7" + p;
  if (p.length === 11 && p.startsWith("8")) p = "7" + p.slice(1);
  // только мобильные 79XXXXXXXXX: на городские номера flash-call не приходит
  if (p.length === 11 && p.startsWith("79")) return p;
  return null;
}

/**
 * Гвард серверных страниц владельца: неавторизованных отправляет на вход,
 * остальных — в их собственный раздел.
 */
export async function requireOwnerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isOwnerRole(user.role)) redirect(cabinetPath(user.role));
  return user;
}

export async function requireDeveloper() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DEVELOPER") throw new Error("FORBIDDEN");
  return user;
}

export async function requireDeveloperPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "DEVELOPER") redirect(cabinetPath(user.role));
  return user;
}
