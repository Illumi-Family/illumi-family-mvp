import { z } from "zod";
import {
	adminPublishHomeSectionBodySchema,
	adminUpsertHomeSectionBodySchema,
	homeSectionEntryKeySchema,
} from "../content/content.schema";

export const adminHomeSectionParamSchema = z.object({
	entryKey: homeSectionEntryKeySchema,
});

export const adminAssetUploadBodySchema = z.object({
	fileName: z.string().min(1).max(255),
	contentType: z.string().min(1).max(255),
	dataBase64: z.string().min(1),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
});

export {
	adminPublishHomeSectionBodySchema,
	adminUpsertHomeSectionBodySchema,
	homeSectionEntryKeySchema,
};

export type AdminAssetUploadBody = z.infer<typeof adminAssetUploadBodySchema>;
