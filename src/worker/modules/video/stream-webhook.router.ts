import { Hono } from "hono";
import type { AppContext } from "../../types";
import { ingestStreamWebhookHandlers } from "./stream-webhook.controller";

const streamWebhookRouter = new Hono<AppContext>();

streamWebhookRouter.post("/stream", ...ingestStreamWebhookHandlers);

export { streamWebhookRouter };
