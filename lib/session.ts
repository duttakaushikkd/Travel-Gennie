import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tg_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  email: string;
  userId: string;
};

type SessionPayload = SessionUser & { exp: number };

function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Add a long random string to .env.local.");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", requireAuthSecret()).update(value).digest("base64url");
}

export function encodeSession(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function decodeSession(token: string | undefined | null): SessionUser | null {
  if (!token) {
    return null;
  }
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }
  const expected = sign(encoded);
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || !payload.email || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { email: payload.email, userId: payload.userId };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

export function getSessionFromRequest(request: Request): SessionUser | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return null;
  }
  const match = cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]+)`));
  return decodeSession(match?.[1] ? decodeURIComponent(match[1]) : null);
}
