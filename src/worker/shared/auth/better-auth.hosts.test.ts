import { describe, expect, it } from "vitest";
import {
	buildAllowedAuthHosts,
	buildTrustedOrigins,
	createAuth,
} from "./better-auth";

describe("better-auth host/origin builders", () => {
	it("includes admin subdomains in allowed hosts", () => {
		const hosts = buildAllowedAuthHosts({
			APP_ENV: "dev",
			API_VERSION: "v1",
			BETTER_AUTH_BASE_URL: "https://dev.illumi-family.com",
		} as never);

		expect(hosts).toContain("admin-dev.illumi-family.com");
		expect(hosts).toContain("admin.illumi-family.com");
	});

	it("includes admin origins in trusted origin list", () => {
		const origins = buildTrustedOrigins({
			APP_ENV: "dev",
			API_VERSION: "v1",
			BETTER_AUTH_BASE_URL: "https://dev.illumi-family.com",
		} as never);

		expect(origins).toContain("https://admin-dev.illumi-family.com");
		expect(origins).toContain("https://admin.illumi-family.com");
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
