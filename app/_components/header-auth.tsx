import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { getSession } from "@/lib/get-session";

export async function HeaderAuth() {
  const session = await getSession();

  if (!session) {
    return (
      <>
        <Link className="rounded-md border px-3 py-1.5" href="/sign-in">
          Sign in
        </Link>
        <Link
          className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground"
          href="/sign-up"
        >
          Sign up
        </Link>
      </>
    );
  }

  return (
    <form action={signOutAction} className="flex items-center gap-3">
      <span className="hidden max-w-[12rem] truncate text-muted-foreground text-sm sm:inline">
        {session.email}
      </span>
      <button className="rounded-md border px-3 py-1.5" type="submit">
        Sign out
      </button>
    </form>
  );
}
