import { AppError } from "../../http/errors";
import {
	extractStreamVideoId,
	resolveVideoProcessingStatus,
	streamWebhookBodySchema,
} from "../../../modules/video/video.schema";

export const STREAM_WEBHOOK_SIGNATURE_HEADER = "Webhook-Signature";
export const STREAM_WEBHOOK_SIGNATURE_MAX_AGE_SECONDS = 300;

const encoder = new TextEncoder();

const timingSafeEqual = (a: string, b: string) => {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i += 1) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
};

export const createStreamWebhookSignature = async (
	secret: string,
	timestamp: string,
	rawBody: string,
) => {
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signatureBuffer = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(`${timestamp}.${rawBody}`),
	);
	return Array.from(new Uint8Array(signatureBuffer))
		.map((item) => item.toString(16).padStart(2, "0"))
		.join("");
};

type ParsedWebhookSignature = {
	timestamp: string;
	signatures: string[];
};

const parseWebhookSignature = (
	header: string | null | undefined,
): ParsedWebhookSignature | null => {
	if (!header) return null;
	const segments = header
		.split(",")
		.map((segment) => segment.trim())
		.filter(Boolean);
	if (segments.length === 0) return null;

	let timestamp: string | null = null;
	const signatures: string[] = [];

	for (const segment of segments) {
		const equalIndex = segment.indexOf("=");
		if (equalIndex <= 0 || equalIndex === segment.length - 1) {
			continue;
		}
		const key = segment.slice(0, equalIndex).trim();
		const value = segment.slice(equalIndex + 1).trim();
		if (!value) continue;
		if (key === "time") {
			timestamp = value;
			continue;
		}
		if (key === "sig1") {
			signatures.push(value.toLowerCase());
		}
	}

	if (!timestamp || signatures.length === 0) return null;
	return { timestamp, signatures };
};

export const verifyStreamWebhookSignature = async (
	secret: string,
	rawBody: string,
	signatureHeader: string | null | undefined,
	nowEpochSeconds: number = Math.floor(Date.now() / 1000),
	maxAgeSeconds: number = STREAM_WEBHOOK_SIGNATURE_MAX_AGE_SECONDS,
) => {
	const parsed = parseWebhookSignature(signatureHeader);
	if (!parsed) return false;

	const signatureTime = Number.parseInt(parsed.timestamp, 10);
	if (!Number.isFinite(signatureTime)) return false;

	if (Math.abs(nowEpochSeconds - signatureTime) > maxAgeSeconds) {
		return false;
	}

	const expectedSignature = await createStreamWebhookSignature(
		secret,
		parsed.timestamp,
		rawBody,
	);
	return parsed.signatures.some((signature) =>
		timingSafeEqual(expectedSignature, signature),
	);
};

export const parseStreamWebhookEvent = (payload: unknown) => {
	const parsed = streamWebhookBodySchema.parse(payload);
	const streamVideoId = extractStreamVideoId(parsed);
	if (!streamVideoId) {
		throw new AppError("BAD_REQUEST", "Stream webhook payload missing video id", 400);
	}

	return {
		streamVideoId,
		processingStatus: resolveVideoProcessingStatus({
			status: parsed.status,
			readyToStream: parsed.readyToStream,
		}),
		durationSeconds:
			typeof parsed.duration === "number" && Number.isFinite(parsed.duration)
				? Math.max(0, Math.round(parsed.duration))
				: null,
		posterUrl: parsed.thumbnail ?? parsed.preview ?? null,
	};
};
