import { describe, expect, it } from "vitest";
import {
	buildAllowedAuthHosts,
	buildTrustedOrigins,
	createAuth,
} from "./better-auth";

describe("better-auth host/origin builders", () => {
	it("includes only dev admin hosts in dev allowed hosts", () => {
		const hosts = buildAllowedAuthHosts({
			APP_ENV: "dev",
			API_VERSION: "v1",
			BETTER_AUTH_BASE_URL: "https://dev.illumi-family.com",
		} as never);

		expect(hosts).toContain("admin-dev.illumi-family.com");
		expect(hosts).not.toContain("admin.illumi-family.com");
	});

	it("includes only dev admin origins in dev trusted origin list", () => {
		const origins = buildTrustedOrigins({
			APP_ENV: "dev",
			API_VERSION: "v1",
			BETTER_AUTH_BASE_URL: "https://dev.illumi-family.com",
		} as never);

		expect(origins).toContain("https://admin-dev.illumi-family.com");
		expect(origins).not.toContain("https://admin.illumi-family.com");
		expect(origins).toContain("http://localhost:5173");
	});

	it("includes only prod admin origins in prod trusted origin list", () => {
		const origins = buildTrustedOrigins({
			APP_ENV: "prod",
			API_VERSION: "v1",
			BETTER_AUTH_BASE_URL: "https://illumi-family.com",
		} as never);

		expect(origins).toContain("https://admin.illumi-family.com");
		expect(origins).not.toContain("https://admin-dev.illumi-family.com");
		expect(origins).not.toContain("http://localhost:5173");
	});

	it("throws actionable message when BETTER_AUTH_SECRET is missing in dev", () => {
		const callCreateAuth = () =>
			createAuth({
				APP_ENV: "dev",
				API_VERSION: "v1",
				BETTER_AUTH_BASE_URL: "http://localhost:5173",
			} as never);

		expect(callCreateAuth).toThrowError(/Missing BETTER_AUTH_SECRET/);
		expect(callCreateAuth).toThrowError(/\.dev\.vars\.dev/);
		expect(callCreateAuth).toThrowError(
			/docs\/better-auth-secret-runbook\.md/,
		);
	});
});
