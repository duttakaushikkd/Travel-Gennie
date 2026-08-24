"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction, signUpAction, type AuthFormState } from "@/app/actions/auth";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

const initialState: AuthFormState = {};

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "sign-up" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const title = mode === "sign-up" ? "Create an account" : "Sign in";
  const submitLabel = mode === "sign-up" ? "Sign up" : "Sign in";

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6">
      <div className="space-y-1">
        <h1 className="font-medium text-xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">
          Pick a username and password. Login checks them against MongoDB.
        </p>
      </div>
      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="block space-y-1.5 text-sm">
        <span>Username</span>
        <Input
          autoComplete="username"
          minLength={3}
          name="username"
          required
          type="text"
        />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span>Password</span>
        <Input
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          minLength={4}
          name="password"
          required
          type="password"
        />
      </label>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Please wait…" : submitLabel}
      </Button>
    </form>
  );
}
