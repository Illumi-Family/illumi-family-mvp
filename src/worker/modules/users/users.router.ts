import { Hono } from "hono";
import type { AppContext } from "../../types";
import {
	getCurrentUserHandlers,
	updateCurrentUserHandlers,
} from "./users.controller";

const usersRouter = new Hono<AppContext>();

usersRouter.get("/me", ...getCurrentUserHandlers);
usersRouter.patch("/me", ...updateCurrentUserHandlers);

export { usersRouter };
