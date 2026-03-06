import { describe, expect, it } from "vitest";
import {
	getAdminEmailWhitelist,
	isWhitelistedAdminEmail,
	normalizeEmail,
} from "./admin-access";

describe("admin access utils", () => {
	it("normalizes emails", () => {
		expect(normalizeEmail(" Admin@Illumi-Family.com ")).toBe(
			"admin@illumi-family.com",
		);
	});

	it("reads env-specific hard-coded whitelist", () => {
		const devWhitelist = getAdminEmailWhitelist({
			APP_ENV: "dev",
			API_VERSION: "v1",
		} as never);
		const prodWhitelist = getAdminEmailWhitelist({
			APP_ENV: "prod",
			API_VERSION: "v1",
		} as never);

		expect(devWhitelist.has("lguangcong@163.com")).toBe(true);
		expect(prodWhitelist.has("lguangcong@163.com")).toBe(true);
	});

	it("checks membership in whitelist", () => {
		const whitelist = new Set(["lguangcong@163.com"]);
		expect(isWhitelistedAdminEmail(" lguangcong@163.com ", whitelist)).toBe(
			true,
		);
		expect(isWhitelistedAdminEmail("guest@example.com", whitelist)).toBe(false);
	});
});
