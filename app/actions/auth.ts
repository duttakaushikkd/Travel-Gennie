"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { encodeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { createUser, verifyUser } from "@/lib/users";

export type AuthFormState = {
  error?: string;
};

async function setSessionCookie(user: { userId: string; username: string }) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(user), sessionCookieOptions());
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    const user = await createUser(username, password);
    await setSessionCookie(user);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create the account." };
  }
  redirect("/");
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    const user = await verifyUser(username, password);
    await setSessionCookie(user);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to sign in." };
  }
  redirect("/");
}

export async function signOutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/sign-in");
}
