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
	method?: "GET" | "POST" | "PUT";
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

export type CreateUserInput = {
	email: string;
	name: string;
};

export type HomeContentPayload = {
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
	updatedAt: string;
};

export type AdminMePayload = {
	me: {
		authUserId: string;
	};
};

export type HomeSectionEntryKey =
	| "home.philosophy"
	| "home.daily_notes"
	| "home.stories"
	| "home.colearning";

export type AdminHomeSectionRecord = {
	entryKey: HomeSectionEntryKey;
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
	entryKey: HomeSectionEntryKey;
	title: string;
	summaryMd?: string;
	bodyMd?: string;
	contentJson: Record<string, unknown>;
};

export type PublishHomeSectionInput = {
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

export const listUsers = async (): Promise<UserRecord[]> => {
	const data = await request<{ users: UserRecord[] }>("/api/users");
	return data.users;
};

export const createUser = async (input: CreateUserInput): Promise<UserRecord> => {
	const data = await request<{ user: UserRecord }>("/api/users", {
		method: "POST",
		body: JSON.stringify(input),
		headers: {
			"Content-Type": "application/json",
		},
	});
	return data.user;
};

export const getHomeContent = async (): Promise<HomeContentPayload> => {
	return request<HomeContentPayload>("/api/content/home");
};

export const getAdminMe = async (): Promise<AdminMePayload> => {
	return request<AdminMePayload>("/api/admin/me");
};

export const listAdminHomeSections = async (): Promise<AdminHomeSectionRecord[]> => {
	const data = await request<{ sections: AdminHomeSectionRecord[] }>(
		"/api/admin/content/home",
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
	}>(`/api/admin/content/home/${input.entryKey}`, {
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
	});
};

export const publishAdminHomeSection = async (
	input: PublishHomeSectionInput,
) => {
	return request<{ changed: boolean; entryId: string; revisionId: string }>(
		`/api/admin/content/home/${input.entryKey}/publish`,
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
