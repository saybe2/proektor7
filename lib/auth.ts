import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";
import type { Role } from "@prisma/client";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32 || secret.includes("ЗАМЕНИТЬ"))) {
    throw new Error("AUTH_SECRET must contain at least 32 characters in production");
  }
  return new TextEncoder().encode(secret || "development-only-secret-change-before-production");
}
const COOKIE_NAME = "proektor_session";
const SESSION_DAYS = 90;

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
    secure: process.env.NODE_ENV === "production",
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
  if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireOwner() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
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
  if (p.length === 11 && p.startsWith("7")) return p;
  return null;
}
