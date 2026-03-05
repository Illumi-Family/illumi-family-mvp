import { Hono } from "hono";
import type { AppContext } from "../../types";
import { authProxyHandlers, rollbackIdentityHandlers } from "./auth.controller";

const authRouter = new Hono<AppContext>();

authRouter.post("/identities/rollback", ...rollbackIdentityHandlers);
authRouter.all("/*", ...authProxyHandlers);

export { authRouter };
