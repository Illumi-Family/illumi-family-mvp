import { Hono } from "hono";
import type { AppContext } from "../../types";
import { listPublicVideosHandlers } from "./public-video.controller";

const publicVideoRouter = new Hono<AppContext>();

publicVideoRouter.get("/videos", ...listPublicVideosHandlers);

export { publicVideoRouter };
