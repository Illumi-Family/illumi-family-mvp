import { describe, expect, it, vi } from "vitest";
import app from "./index";

const testEnv = {
	APP_ENV: "dev",
	API_VERSION: "v1",
	ASSETS: {
		fetch: vi.fn(async () =>
			new Response(
				`<!doctype html><html><head><meta name="description" content="old" /><title>old</title></head><body></body></html>`,
				{
					status: 200,
					headers: { "content-type": "text/html; charset=UTF-8" },
				},
			),
		),
	},
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

	it("renders seo html for home route", async () => {
		const response = await app.request("/", {}, testEnv as never);
		expect(response.status).toBe(200);
		const text = await response.text();
		expect(text).toContain("童蒙家塾｜传播传统文化｜家庭教育系统");
		expect(text).toContain('property="og:title"');
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

	it("requires auth session for /api/admin/videos/import", async () => {
		const response = await app.request(
			"/api/admin/videos/import",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ streamVideoId: "stream-1" }),
			},
			testEnv as never,
		);
		expect(response.status).toBe(401);
		const body = (await response.json()) as {
			success: boolean;
			error: { code: string };
		};
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("UNAUTHORIZED");
	});

	it("requires auth session for /api/admin/videos/sync-catalog", async () => {
		const response = await app.request(
			"/api/admin/videos/sync-catalog",
			{
				method: "POST",
			},
			testEnv as never,
		);
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
