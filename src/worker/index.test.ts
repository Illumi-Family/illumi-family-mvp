import { describe, expect, it } from "vitest";
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
});
