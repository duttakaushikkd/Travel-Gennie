import { createClerkClient } from "@clerk/backend";
import { type AuthFn, localDev, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

function clerkSession(): AuthFn<Request> {
  return async (request) => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!secretKey || !publishableKey) {
      return null;
    }

    const clerk = createClerkClient({ secretKey, publishableKey });
    const requestState = await clerk.authenticateRequest(request, {
      secretKey,
      publishableKey,
    });

    if (!requestState.isSignedIn) {
      return null;
    }

    const auth = requestState.toAuth();
    if (!auth.userId) {
      return null;
    }

    return {
      authenticator: "clerk",
      principalId: auth.userId,
      principalType: "user",
      attributes: {},
    };
  };
}

export default eveChannel({
  auth: [clerkSession(), vercelOidc(), localDev()],
});
