import { z } from "zod";
import { AppError } from "../../http/errors";
import type { AppBindings } from "../../../types";

const cloudflareEnvelopeSchema = z.object({
	success: z.boolean(),
	result: z.unknown().optional(),
	errors: z
		.array(
			z.object({
				message: z.string().optional(),
				code: z.number().optional(),
			}),
		)
		.optional(),
});

const directUploadResultSchema = z.object({
	uid: z.string().min(1),
	uploadURL: z.string().min(1),
	expiry: z.string().optional(),
});

const streamVideoResultSchema = z
	.object({
		uid: z.string().min(1),
		readyToStream: z.boolean().optional(),
		status: z
			.union([
				z.string(),
				z.object({ state: z.string().optional() }),
			])
			.optional(),
		duration: z.number().nonnegative().optional(),
		thumbnail: z.string().min(1).optional(),
		preview: z.string().min(1).optional(),
	})
	.passthrough();

const readStreamConfig = (env: AppBindings) => {
	const accountId = env.STREAM_ACCOUNT_ID?.trim();
	const apiToken = env.STREAM_API_TOKEN?.trim();
	if (!accountId || !apiToken) {
		throw new AppError(
			"CONFIG_ERROR",
			"Stream integration is not configured",
			500,
		);
	}
	return { accountId, apiToken };
};

const buildErrorMessage = (
	errors?: Array<{ message?: string; code?: number }> | undefined,
	fallback?: string,
) => {
	if (!errors || errors.length === 0) return fallback ?? "Stream API request failed";
	const first = errors[0];
	if (!first) return fallback ?? "Stream API request failed";
	if (first.message && first.code) return `${first.code}: ${first.message}`;
	if (first.message) return first.message;
	if (first.code) return `Stream API error ${first.code}`;
	return fallback ?? "Stream API request failed";
};

const streamRequest = async <T>(
	env: AppBindings,
	path: string,
	init: RequestInit,
	resultSchema: z.ZodType<T>,
): Promise<T> => {
	const { accountId, apiToken } = readStreamConfig(env);
	const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream${path}`;
	let response: Response;
	try {
		response = await fetch(url, {
			...init,
			headers: {
				Authorization: `Bearer ${apiToken}`,
				"Content-Type": "application/json",
				...init.headers,
			},
		});
	} catch (error) {
		throw new AppError("STREAM_API_ERROR", "Failed to call Stream API", 502, {
			error,
		});
	}

	let parsedEnvelope: z.infer<typeof cloudflareEnvelopeSchema>;
	try {
		const rawBody = await response.json();
		parsedEnvelope = cloudflareEnvelopeSchema.parse(rawBody);
	} catch {
		throw new AppError(
			"STREAM_API_ERROR",
			"Stream API returned invalid JSON payload",
			502,
		);
	}

	if (!response.ok || !parsedEnvelope.success) {
		throw new AppError(
			"STREAM_API_ERROR",
			buildErrorMessage(parsedEnvelope.errors, "Stream API request failed"),
			502,
			{ status: response.status },
		);
	}

	try {
		return resultSchema.parse(parsedEnvelope.result);
	} catch (error) {
		throw new AppError(
			"STREAM_API_ERROR",
			"Stream API returned unexpected result payload",
			502,
			{ error },
		);
	}
};

export const createStreamDirectUpload = async (
	env: AppBindings,
	input?: { maxDurationSeconds?: number },
) => {
	const maxDurationSeconds = input?.maxDurationSeconds ?? 3_600;
	const result = await streamRequest(
		env,
		"/direct_upload",
		{
			method: "POST",
			body: JSON.stringify({ maxDurationSeconds }),
		},
		directUploadResultSchema,
	);

	return {
		streamVideoId: result.uid,
		uploadUrl: result.uploadURL,
		expiresAt: result.expiry ?? null,
	};
};

export const getStreamVideoById = async (
	env: AppBindings,
	streamVideoId: string,
) => {
	return streamRequest(
		env,
		`/${encodeURIComponent(streamVideoId)}`,
		{ method: "GET", headers: { "Content-Type": "application/json" } },
		streamVideoResultSchema,
	);
};

export const deleteStreamVideoById = async (
	env: AppBindings,
	streamVideoId: string,
) => {
	await streamRequest(
		env,
		`/${encodeURIComponent(streamVideoId)}`,
		{ method: "DELETE", headers: { "Content-Type": "application/json" } },
		z.any(),
	);
};

export type StreamVideoResponse = z.infer<typeof streamVideoResultSchema>;
