import { Hono } from "hono";
import type { AppContext } from "../../types";
import { getAssetHandlers, getHomeContentHandlers } from "./content.controller";
import { publicVideoRouter } from "../video/public-video.router";

const contentRouter = new Hono<AppContext>();

contentRouter.get("/home", ...getHomeContentHandlers);
contentRouter.get("/assets/:assetId", ...getAssetHandlers);
contentRouter.route("/", publicVideoRouter);

export { contentRouter };
