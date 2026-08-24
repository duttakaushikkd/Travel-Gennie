import { type AuthFn, localDev } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";
import { getSessionFromRequest } from "../../lib/session";

function appSession(): AuthFn<Request> {
  return async (request) => {
    const session = getSessionFromRequest(request);
    if (!session) {
      return null;
    }
    return {
      attributes: { email: session.email },
      authenticator: "password",
      principalId: session.userId,
      principalType: "user",
    };
  };
}

export default eveChannel({
  auth: [appSession(), localDev()],
});
