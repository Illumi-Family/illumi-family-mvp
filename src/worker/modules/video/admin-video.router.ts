import { Hono } from "hono";
import type { AppContext } from "../../types";
import {
	cleanupAdminVideoDraftHandlers,
	createAdminVideoUploadUrlHandlers,
	listAdminVideosHandlers,
	publishAdminVideoHandlers,
	syncAdminVideoStatusHandlers,
	unpublishAdminVideoHandlers,
	updateAdminVideoHandlers,
} from "./admin-video.controller";

const adminVideoRouter = new Hono<AppContext>();

adminVideoRouter.get("/", ...listAdminVideosHandlers);
adminVideoRouter.post("/upload-url", ...createAdminVideoUploadUrlHandlers);
adminVideoRouter.patch("/:videoId", ...updateAdminVideoHandlers);
adminVideoRouter.post("/:videoId/publish", ...publishAdminVideoHandlers);
adminVideoRouter.post("/:videoId/unpublish", ...unpublishAdminVideoHandlers);
adminVideoRouter.post("/:videoId/sync-status", ...syncAdminVideoStatusHandlers);
adminVideoRouter.delete("/:videoId", ...cleanupAdminVideoDraftHandlers);

export { adminVideoRouter };
