import { Hono } from "hono";
import type { AppContext } from "../../types";
import {
	getSeoHomePageHandlers,
	getSeoVideoPageHandlers,
} from "./seo.controller";

const seoRouter = new Hono<AppContext>();

seoRouter.get("/", ...getSeoHomePageHandlers);
seoRouter.get("/video/:streamVideoId", ...getSeoVideoPageHandlers);

export { seoRouter };
