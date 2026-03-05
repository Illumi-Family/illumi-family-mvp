import { Hono } from "hono";
import type { AppContext } from "../../types";
import { createUserHandlers, listUsersHandlers } from "./users.controller";

const usersRouter = new Hono<AppContext>();

usersRouter.get("/", ...listUsersHandlers);
usersRouter.post("/", ...createUserHandlers);

export { usersRouter };
