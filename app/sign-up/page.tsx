import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/app/_components/auth-form";
import { getSession } from "@/lib/get-session";

export default async function SignUpPage() {
  if (await getSession()) {
    redirect("/");
  }

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-background p-6 text-foreground">
      <div className="space-y-4">
        <AuthForm mode="sign-up" />
        <p className="text-center text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link className="text-foreground underline-offset-4 hover:underline" href="/sign-in">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
