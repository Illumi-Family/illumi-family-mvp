import { describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { AppContext } from "../../types";
import { STREAM_WEBHOOK_SIGNATURE_HEADER } from "../../shared/integrations/stream/stream-webhook";
import { handleAppError } from "../../shared/http/middleware/error-handler";

const ingestStreamWebhook = vi.fn();

vi.mock("../../shared/db/client", () => ({
	getDb: vi.fn(() => ({})),
}));

vi.mock("./video.repository", () => ({
	VideoRepository: vi.fn(),
}));

vi.mock("./video.service", () => ({
	VideoService: vi.fn().mockImplementation(function VideoServiceMock() {
		return {
			ingestStreamWebhook,
		};
	}),
}));

import { streamWebhookRouter } from "./stream-webhook.router";

const createTestApp = () => {
	const app = new Hono<AppContext>();
	app.route("/api/webhooks", streamWebhookRouter);
	app.onError((error, c) => handleAppError(error, c));
	return app;
};

describe("stream webhook controller", () => {
	beforeEach(() => {
		ingestStreamWebhook.mockReset();
	});

	it("returns 400 when webhook body is empty", async () => {
		const app = createTestApp();
		const response = await app.request(
			"/api/webhooks/stream",
			{ method: "POST", body: "" },
			{} as never,
		);

		expect(response.status).toBe(400);
		const body = (await response.json()) as {
			success: boolean;
			error: { code: string };
		};
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("BAD_REQUEST");
	});

	it("passes payload and signature to service", async () => {
		ingestStreamWebhook.mockResolvedValue({ updated: true });
		const app = createTestApp();
		const rawBody = '{"uid":"stream-1"}';

		const response = await app.request(
			"/api/webhooks/stream",
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
					[STREAM_WEBHOOK_SIGNATURE_HEADER]: "abc123",
				},
				body: rawBody,
			},
			{ STREAM_WEBHOOK_SECRET: "secret" } as never,
		);

		expect(response.status).toBe(202);
		expect(ingestStreamWebhook).toHaveBeenCalledWith(
			{ STREAM_WEBHOOK_SECRET: "secret" },
			{
				rawBody,
				signature: "abc123",
				payload: { uid: "stream-1" },
			},
		);
	});
});
