import { Hono } from "hono";
import type { AppContext } from "../../types";
import {
	cleanupAdminVideoDraftHandlers,
	createAdminVideoUploadUrlHandlers,
	importAdminVideoHandlers,
	listAdminVideosHandlers,
	publishAdminVideoHandlers,
	syncAdminVideoCatalogHandlers,
	syncAdminVideoStatusHandlers,
	unpublishAdminVideoHandlers,
	updateAdminVideoHandlers,
} from "./admin-video.controller";

const adminVideoRouter = new Hono<AppContext>();

adminVideoRouter.get("/", ...listAdminVideosHandlers);
adminVideoRouter.post("/upload-url", ...createAdminVideoUploadUrlHandlers);
adminVideoRouter.post("/import", ...importAdminVideoHandlers);
adminVideoRouter.post("/sync-catalog", ...syncAdminVideoCatalogHandlers);
adminVideoRouter.patch("/:videoId", ...updateAdminVideoHandlers);
adminVideoRouter.post("/:videoId/publish", ...publishAdminVideoHandlers);
adminVideoRouter.post("/:videoId/unpublish", ...unpublishAdminVideoHandlers);
adminVideoRouter.post("/:videoId/sync-status", ...syncAdminVideoStatusHandlers);
adminVideoRouter.delete("/:videoId", ...cleanupAdminVideoDraftHandlers);

export { adminVideoRouter };
