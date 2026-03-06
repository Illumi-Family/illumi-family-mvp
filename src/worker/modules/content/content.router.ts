import { Hono } from "hono";
import type { AppContext } from "../../types";
import { getAssetHandlers, getHomeContentHandlers } from "./content.controller";

const contentRouter = new Hono<AppContext>();

contentRouter.get("/home", ...getHomeContentHandlers);
contentRouter.get("/assets/:assetId", ...getAssetHandlers);

export { contentRouter };
