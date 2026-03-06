import { Hono } from "hono";
import type { AppContext } from "../../types";
import {
	adminListHomeContentHandlers,
	adminMeHandlers,
	adminPublishHomeContentHandlers,
	adminSaveHomeContentDraftHandlers,
	adminUploadAssetHandlers,
} from "./admin.controller";

const adminRouter = new Hono<AppContext>();

adminRouter.get("/me", ...adminMeHandlers);
adminRouter.get("/content/home", ...adminListHomeContentHandlers);
adminRouter.put(
	"/content/home/:entryKey",
	...adminSaveHomeContentDraftHandlers,
);
adminRouter.post(
	"/content/home/:entryKey/publish",
	...adminPublishHomeContentHandlers,
);
adminRouter.post("/assets/upload", ...adminUploadAssetHandlers);

export { adminRouter };
