import { cookies } from "next/headers";
import { decodeSession, SESSION_COOKIE, type SessionUser } from "@/lib/session";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}
