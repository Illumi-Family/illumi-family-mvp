import type { AppLocale } from "@/i18n/types";

type ApiFailure = {
	success: false;
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
	requestId: string;
};

type ApiSuccess<T> = {
	success: true;
	data: T;
	requestId: string;
};

type ApiResponse<T> = ApiFailure | ApiSuccess<T>;

type RequestOptions = {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: string;
	headers?: HeadersInit;
};

export class ApiClientError extends Error {
	constructor(
		public readonly code: string,
		message: string,
		public readonly status: number,
		public readonly details?: unknown,
	) {
		super(`${code}: ${message}`);
		this.name = "ApiClientError";
	}
}

export type HealthPayload = {
	status: string;
	appEnv: string;
	apiVersion: string;
	timestamp: string;
};

export type UserRecord = {
	id: string;
	email: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

export type UpdateCurrentUserInput = {
	name: string;
};

export type HomeContentPayload = {
	heroSlogan: {
		title: string;
		subtitle: string;
	};
	featuredVideos: {
		main: {
			streamVideoId: string;
		};
		characters: {
			items: Array<{
				streamVideoId: string;
			}>;
		};
	};
	philosophy: {
		intro: string;
		items: Array<{ title: string; description: string }>;
	};
	dailyNotes: {
		items: Array<{
			date: string;
			title: string;
			summary: string;
			tags: string[];
		}>;
	};
	stories: {
		items: Array<{
			title: string;
			summary: string;
			publishDate: string;
			duration: string;
			status: "published" | "coming_soon";
			link?: string;
		}>;
	};
	colearning: {
		intro: string;
		methods: Array<{ title: string; description: string }>;
		benefits: string[];
		caseHighlight: {
			title: string;
			summary: string;
			cta: { label: string; href: string };
		};
	};
	locale: AppLocale;
	fallbackFrom: AppLocale[];
	updatedAt: string;
};

export type AdminMePayload = {
	me: {
		authUserId: string;
	};
};

export type HomeSectionEntryKey =
	| "home.hero_slogan"
	| "home.main_video"
	| "home.character_videos"
	| "home.philosophy"
	| "home.daily_notes"
	| "home.stories"
	| "home.colearning";

export type AdminHomeSectionRecord = {
	entryKey: HomeSectionEntryKey;
	locale: AppLocale;
	status: string;
	publishedRevisionId: string | null;
	latestRevisionId: string | null;
	latestRevisionNo: number | null;
	latestTitle: string | null;
	latestSummaryMd: string | null;
	latestBodyMd: string | null;
	latestContentJson: unknown;
	updatedAt: string;
};

export type SaveHomeSectionDraftInput = {
	locale: AppLocale;
	entryKey: HomeSectionEntryKey;
	title: string;
	summaryMd?: string;
	bodyMd?: string;
	contentJson: Record<string, unknown>;
};

export type PublishHomeSectionInput = {
	locale: AppLocale;
	entryKey: HomeSectionEntryKey;
	revisionId?: string;
};

export type UploadAdminAssetInput = {
	fileName: string;
	contentType: string;
	dataBase64: string;
	width?: number;
	height?: number;
};

export type AdminAssetRecord = {
	id: string;
	r2Key: string;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
	width: number | null;
	height: number | null;
	sha256: string;
	uploadedByAuthUserId: string | null;
	createdAt: string;
};

export type VideoProcessingStatus = "processing" | "ready" | "failed";
export type VideoPublishStatus = "draft" | "published";

export type AdminVideoRecord = {
	id: string;
	streamVideoId: string;
	processingStatus: VideoProcessingStatus;
	publishStatus: VideoPublishStatus;
	title: string;
	posterUrl: string | null;
	durationSeconds: number | null;
	createdByAuthUserId: string | null;
	updatedByAuthUserId: string | null;
	createdAt: string;
	updatedAt: string;
	publishedAt: string | null;
};

export type PublicVideoRecord = {
	id: string;
	streamVideoId: string;
	title: string;
	posterUrl: string | null;
	durationSeconds: number | null;
	publishedAt: string;
};

export type CreateAdminVideoUploadUrlInput = {
	title?: string;
	maxDurationSeconds?: number;
};

export type CreateAdminVideoUploadUrlResult = {
	videoId: string;
	uploadUrl: string;
	expiresAt: string | null;
};

export type ImportAdminVideoInput = {
	streamVideoId: string;
	title?: string;
	posterUrl?: string;
};

export type ImportAdminVideoResult = {
	reused: boolean;
	video: AdminVideoRecord;
};

export type UpdateAdminVideoInput = {
	videoId: string;
	title?: string;
	posterUrl?: string | null;
};

const readJson = async <T>(response: Response): Promise<ApiResponse<T>> => {
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		throw new ApiClientError(
			"INVALID_RESPONSE",
			"Expected JSON response from API",
			response.status || 500,
		);
	}

	return (await response.json()) as ApiResponse<T>;
};

const request = async <T>(url: string, options?: RequestOptions): Promise<T> => {
	const response = await fetch(url, {
		method: options?.method,
		body: options?.body,
		headers: {
			Accept: "application/json",
			...options?.headers,
		},
	});

	const payload = await readJson<T>(response);

	if (!payload.success) {
		throw new ApiClientError(
			payload.error.code,
			payload.error.message,
			response.status || 500,
			payload.error.details,
		);
	}

	return payload.data;
};

export const getHealth = async (): Promise<HealthPayload> => {
	const data = await request<HealthPayload>("/api/health");
	return data;
};

export const getCurrentUser = async (): Promise<UserRecord> => {
	const data = await request<{ user: UserRecord }>("/api/users/me");
	return data.user;
};

export const updateCurrentUser = async (
	input: UpdateCurrentUserInput,
): Promise<UserRecord> => {
	const data = await request<{ user: UserRecord }>("/api/users/me", {
		method: "PATCH",
		body: JSON.stringify(input),
		headers: {
			"Content-Type": "application/json",
		},
	});
	return data.user;
};

export const getHomeContent = async (
	locale?: AppLocale,
): Promise<HomeContentPayload> => {
	const query = locale ? `?locale=${encodeURIComponent(locale)}` : "";
	return request<HomeContentPayload>(`/api/content/home${query}`);
};

const withLocaleQuery = (path: string, locale: AppLocale) =>
	`${path}?locale=${encodeURIComponent(locale)}`;

export const getAdminMe = async (): Promise<AdminMePayload> => {
	return request<AdminMePayload>("/api/admin/me");
};

export const listAdminHomeSections = async (
	locale: AppLocale,
): Promise<AdminHomeSectionRecord[]> => {
	const data = await request<{ sections: AdminHomeSectionRecord[] }>(
		withLocaleQuery("/api/admin/content/home", locale),
	);
	return data.sections;
};

export const saveAdminHomeSectionDraft = async (
	input: SaveHomeSectionDraftInput,
) => {
	return request<{
		entryId: string;
		revisionId: string;
		revisionNo: number;
	}>(
		withLocaleQuery(`/api/admin/content/home/${input.entryKey}`, input.locale),
		{
			method: "PUT",
			body: JSON.stringify({
				title: input.title,
				summaryMd: input.summaryMd,
				bodyMd: input.bodyMd,
				contentJson: input.contentJson,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
};

export const publishAdminHomeSection = async (
	input: PublishHomeSectionInput,
) => {
	return request<{ changed: boolean; entryId: string; revisionId: string }>(
		withLocaleQuery(
			`/api/admin/content/home/${input.entryKey}/publish`,
			input.locale,
		),
		{
			method: "POST",
			body: JSON.stringify({
				revisionId: input.revisionId,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
};

export const uploadAdminAsset = async (
	input: UploadAdminAssetInput,
): Promise<AdminAssetRecord> => {
	const data = await request<{ asset: AdminAssetRecord }>(
		"/api/admin/assets/upload",
		{
			method: "POST",
			body: JSON.stringify(input),
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
	return data.asset;
};

export const listAdminVideos = async (): Promise<AdminVideoRecord[]> => {
	const data = await request<{ videos: AdminVideoRecord[] }>("/api/admin/videos");
	return data.videos;
};

export const createAdminVideoUploadUrl = async (
	input: CreateAdminVideoUploadUrlInput,
): Promise<CreateAdminVideoUploadUrlResult> => {
	return request<CreateAdminVideoUploadUrlResult>("/api/admin/videos/upload-url", {
		method: "POST",
		body: JSON.stringify(input),
		headers: {
			"Content-Type": "application/json",
		},
	});
};

export const importAdminVideo = async (
	input: ImportAdminVideoInput,
): Promise<ImportAdminVideoResult> => {
	return request<ImportAdminVideoResult>("/api/admin/videos/import", {
		method: "POST",
		body: JSON.stringify({
			streamVideoId: input.streamVideoId,
			title: input.title,
			posterUrl: input.posterUrl,
		}),
		headers: {
			"Content-Type": "application/json",
		},
	});
};

export const updateAdminVideo = async (
	input: UpdateAdminVideoInput,
): Promise<AdminVideoRecord> => {
	const data = await request<{ video: AdminVideoRecord }>(
		`/api/admin/videos/${encodeURIComponent(input.videoId)}`,
		{
			method: "PATCH",
			body: JSON.stringify({
				title: input.title,
				posterUrl: input.posterUrl,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
	return data.video;
};

export const publishAdminVideo = async (
	videoId: string,
): Promise<{ changed: boolean; video: AdminVideoRecord | null }> => {
	return request<{ changed: boolean; video: AdminVideoRecord | null }>(
		`/api/admin/videos/${encodeURIComponent(videoId)}/publish`,
		{
			method: "POST",
		},
	);
};

export const unpublishAdminVideo = async (
	videoId: string,
): Promise<{ changed: boolean; video: AdminVideoRecord | null }> => {
	return request<{ changed: boolean; video: AdminVideoRecord | null }>(
		`/api/admin/videos/${encodeURIComponent(videoId)}/unpublish`,
		{
			method: "POST",
		},
	);
};

export const syncAdminVideoStatus = async (
	videoId: string,
): Promise<AdminVideoRecord> => {
	const data = await request<{ video: AdminVideoRecord }>(
		`/api/admin/videos/${encodeURIComponent(videoId)}/sync-status`,
		{
			method: "POST",
		},
	);
	return data.video;
};

export const deleteAdminVideoDraft = async (
	videoId: string,
): Promise<{ deleted: boolean; videoId: string; remoteDeleted: boolean }> => {
	return request<{ deleted: boolean; videoId: string; remoteDeleted: boolean }>(
		`/api/admin/videos/${encodeURIComponent(videoId)}`,
		{
			method: "DELETE",
		},
	);
};

export const listPublicVideos = async (): Promise<PublicVideoRecord[]> => {
	const data = await request<{ videos: PublicVideoRecord[] }>("/api/content/videos");
	return data.videos;
};
