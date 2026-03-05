import { Hono } from "hono";
import type { AppContext } from "../../types";
import { getHealthHandlers } from "./health.controller";

const healthRouter = new Hono<AppContext>();

healthRouter.get("/", ...getHealthHandlers);

export { healthRouter };
