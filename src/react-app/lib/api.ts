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
	method?: "GET" | "PATCH";
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
