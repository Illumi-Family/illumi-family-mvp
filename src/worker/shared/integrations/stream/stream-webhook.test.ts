import { describe, expect, it } from "vitest";
import {
	createStreamWebhookSignature,
	parseStreamWebhookEvent,
	verifyStreamWebhookSignature,
} from "./stream-webhook";

describe("stream webhook helper", () => {
	it("validates signature from Cloudflare Webhook-Signature header", async () => {
		const secret = "my-secret";
		const rawBody = '{"uid":"stream-1","readyToStream":true}';
		const timestamp = "1700000000";
		const signature = await createStreamWebhookSignature(
			secret,
			timestamp,
			rawBody,
		);
		const valid = await verifyStreamWebhookSignature(
			secret,
			rawBody,
			`time=${timestamp},sig1=${signature}`,
			1700000000,
			300,
		);

		expect(valid).toBe(true);
	});

	it("rejects expired signatures", async () => {
		const secret = "my-secret";
		const rawBody = '{"uid":"stream-1"}';
		const timestamp = "1700000000";
		const signature = await createStreamWebhookSignature(
			secret,
			timestamp,
			rawBody,
		);
		const valid = await verifyStreamWebhookSignature(
			secret,
			rawBody,
			`time=${timestamp},sig1=${signature}`,
			1700001000,
			300,
		);
		expect(valid).toBe(false);
	});

	it("parses webhook payload to internal event", () => {
		const event = parseStreamWebhookEvent({
			uid: "stream-1",
			readyToStream: true,
			duration: 10.4,
			thumbnail: "https://example.com/poster.jpg",
		});

		expect(event.streamVideoId).toBe("stream-1");
		expect(event.processingStatus).toBe("ready");
		expect(event.durationSeconds).toBe(10);
		expect(event.posterUrl).toBe("https://example.com/poster.jpg");
	});
});
