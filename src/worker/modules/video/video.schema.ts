import { z } from "zod";

export const VIDEO_PROCESSING_STATUSES = [
	"processing",
	"ready",
	"failed",
] as const;
export const VIDEO_PUBLISH_STATUSES = ["draft", "published"] as const;

export const videoProcessingStatusSchema = z.enum(VIDEO_PROCESSING_STATUSES);
export const videoPublishStatusSchema = z.enum(VIDEO_PUBLISH_STATUSES);

export const adminVideoIdParamSchema = z.object({
	videoId: z.string().min(1).max(255),
});

export const adminVideoUploadUrlBodySchema = z.object({
	title: z.string().trim().min(1).max(200).optional(),
	maxDurationSeconds: z.number().int().positive().max(14_400).optional(),
});

export const adminVideoImportBodySchema = z.object({
	streamVideoId: z.string().trim().min(1).max(255),
	title: z.string().trim().min(1).max(200).optional(),
	posterUrl: z.string().trim().min(1).max(2_000).optional(),
});

export const adminVideoUpdateBodySchema = z
	.object({
		title: z.string().trim().min(1).max(200).optional(),
		posterUrl: z.string().trim().min(1).max(2_000).nullable().optional(),
	})
	.refine((value) => value.title !== undefined || value.posterUrl !== undefined, {
		message: "At least one field must be provided",
		path: ["title"],
	});

const streamStatusSchema = z
	.union([
		z.string().min(1),
		z.object({
			state: z.string().min(1).optional(),
		}),
	])
	.optional();

export const streamWebhookBodySchema = z
	.object({
		uid: z.string().min(1).optional(),
		videoUid: z.string().min(1).optional(),
		videoUID: z.string().min(1).optional(),
		readyToStream: z.boolean().optional(),
		status: streamStatusSchema,
		duration: z.number().nonnegative().optional(),
		thumbnail: z.string().min(1).optional(),
		preview: z.string().min(1).optional(),
	})
	.passthrough();

export const resolveVideoProcessingStatus = (input: {
	status?: string | { state?: string };
	readyToStream?: boolean;
}) => {
	if (input.readyToStream) return "ready" as const;

	const rawStatus =
		typeof input.status === "string" ? input.status : input.status?.state;
	const normalized = rawStatus?.toLowerCase().trim();
	if (!normalized) return "processing" as const;
	if (
		normalized.includes("ready") ||
		normalized.includes("live") ||
		normalized.includes("published")
	) {
		return "ready" as const;
	}
	if (
		normalized.includes("error") ||
		normalized.includes("fail") ||
		normalized.includes("timeout")
	) {
		return "failed" as const;
	}
	return "processing" as const;
};

export const extractStreamVideoId = (
	payload: z.infer<typeof streamWebhookBodySchema>,
) => payload.uid ?? payload.videoUid ?? payload.videoUID ?? null;

export type VideoProcessingStatus = z.infer<typeof videoProcessingStatusSchema>;
export type VideoPublishStatus = z.infer<typeof videoPublishStatusSchema>;
export type AdminVideoUploadUrlBody = z.infer<typeof adminVideoUploadUrlBodySchema>;
export type AdminVideoImportBody = z.infer<typeof adminVideoImportBodySchema>;
export type AdminVideoUpdateBody = z.infer<typeof adminVideoUpdateBodySchema>;
export type StreamWebhookBody = z.infer<typeof streamWebhookBodySchema>;
