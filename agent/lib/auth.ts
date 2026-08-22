type ToolSessionCtx = {
  session: {
    id: string;
    auth: {
      current?: { principalId?: string } | null;
      initiator?: { principalId?: string } | null;
    };
  };
};

export function requireUserId(ctx: ToolSessionCtx): string {
  const userId = ctx.session.auth.current?.principalId ?? ctx.session.auth.initiator?.principalId;
  if (!userId || userId.startsWith("eve:")) {
    throw new Error("Sign in to save or load trips.");
  }
  return userId;
}

export function rateLimitKey(ctx: ToolSessionCtx): string {
  return ctx.session.auth.current?.principalId ?? ctx.session.id;
}
