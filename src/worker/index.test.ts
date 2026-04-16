import { describe, expect, it, vi } from "vitest";
import app from "./index";

const testEnv = {
	APP_ENV: "dev",
	API_VERSION: "v1",
} as const;

describe("worker api", () => {
	it("returns health payload from /api/health", async () => {
		const response = await app.request("/api/health", {}, testEnv as never);
		expect(response.status).toBe(200);

		const body = (await response.json()) as {
			success: boolean;
			data: { appEnv: string; apiVersion: string };
		};
		expect(body.success).toBe(true);
		expect(body.data.appEnv).toBe("dev");
		expect(body.data.apiVersion).toBe("v1");
	});

	it("returns structured 404 payload for unknown route", async () => {
		const response = await app.request("/api/does-not-exist", {}, testEnv as never);
		expect(response.status).toBe(404);

		const body = (await response.json()) as {
			success: boolean;
			error: { code: string };
		};
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("ROUTE_NOT_FOUND");
	});

	it("requires auth session for /api/users/me", async () => {
		const response = await app.request("/api/users/me", {}, testEnv as never);
		expect(response.status).toBe(401);
		const body = (await response.json()) as {
			success: boolean;
			error: { code: string };
		};
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("UNAUTHORIZED");
	});

	it("requires auth session for /api/admin/me", async () => {
		const response = await app.request("/api/admin/me", {}, testEnv as never);
		expect(response.status).toBe(401);
		const body = (await response.json()) as {
			success: boolean;
			error: { code: string };
		};
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("UNAUTHORIZED");
	});

	it("requires auth session for /api/admin/videos", async () => {
		const response = await app.request("/api/admin/videos", {}, testEnv as never);
		expect(response.status).toBe(401);
		const body = (await response.json()) as {
			success: boolean;
			error: { code: string };
		};
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("UNAUTHORIZED");
	});

	it("returns 400 for empty stream webhook body", async () => {
		const response = await app.request(
			"/api/webhooks/stream",
			{
				method: "POST",
				body: "",
			},
			testEnv as never,
		);
		expect(response.status).toBe(400);
		const body = (await response.json()) as {
			success: boolean;
			error: { code: string };
		};
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("BAD_REQUEST");
	});

	it("normalizes locale alias for /api/content/home cache key", async () => {
		const cache = {
			get: vi.fn().mockResolvedValue(
				JSON.stringify({
					philosophy: { intro: "", items: [] },
					dailyNotes: { items: [] },
					stories: { items: [] },
					colearning: {
						intro: "",
						methods: [],
						benefits: [],
						caseHighlight: { title: "", summary: "", cta: { label: "", href: "#" } },
					},
					locale: "en-US",
					fallbackFrom: [],
					updatedAt: "2026-03-18T00:00:00.000Z",
				}),
			),
		};

		const response = await app.request(
			"/api/content/home?locale=en",
			{},
			{
				...testEnv,
				CACHE: cache,
			} as never,
		);
		expect(response.status).toBe(200);
		expect(cache.get).toHaveBeenCalledWith("cms:home:published:v1:en-US");

		const body = (await response.json()) as {
			success: boolean;
			data: { locale: string };
		};
		expect(body.success).toBe(true);
		expect(body.data.locale).toBe("en-US");
	});
});
