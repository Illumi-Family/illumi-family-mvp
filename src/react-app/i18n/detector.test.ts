import { afterEach, describe, expect, it, vi } from "vitest";
import {
	detectLocale,
	parseLocaleFromLangParam,
	normalizeLocale,
	setLangQuery,
	setLocaleCookie,
} from "./detector";

describe("i18n locale detector", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("normalizes aliases and canonical locale values", () => {
		expect(normalizeLocale("zh")).toBe("zh-CN");
		expect(normalizeLocale("en")).toBe("en-US");
		expect(normalizeLocale("zh-CN")).toBe("zh-CN");
		expect(normalizeLocale("en-US")).toBe("en-US");
		expect(normalizeLocale("en-GB")).toBe("en-US");
		expect(normalizeLocale("zh-HK")).toBe("zh-CN");
		expect(normalizeLocale("fr-FR")).toBe("zh-CN");
	});

	it("parses query/cookie locale aliases with region prefixes", () => {
		expect(parseLocaleFromLangParam("en-GB")).toBe("en-US");
		expect(parseLocaleFromLangParam("zh-HK")).toBe("zh-CN");
		expect(parseLocaleFromLangParam("en-US")).toBe("en-US");
		expect(parseLocaleFromLangParam("zh-CN")).toBe("zh-CN");
		expect(parseLocaleFromLangParam("fr-FR")).toBeNull();
	});

	it("resolves locale with priority query > cookie > navigator > default", () => {
		expect(
			detectLocale({
				search: "?lang=en",
				cookie: "illumi_locale=zh-CN",
				navigatorLanguage: "zh-CN",
			}),
		).toBe("en-US");

		expect(
			detectLocale({
				search: "?lang=en-GB",
				cookie: "illumi_locale=zh-CN",
				navigatorLanguage: "zh-CN",
			}),
		).toBe("en-US");

		expect(
			detectLocale({
				search: "?lang=zh-HK",
				cookie: "illumi_locale=en-US",
				navigatorLanguage: "en-US",
			}),
		).toBe("zh-CN");

		expect(
			detectLocale({
				search: "",
				cookie: "foo=1; illumi_locale=en-GB",
				navigatorLanguage: "zh-CN",
			}),
		).toBe("en-US");

		expect(
			detectLocale({
				search: "",
				cookie: "",
				navigatorLanguage: "en-GB",
			}),
		).toBe("en-US");

		expect(
			detectLocale({
				search: "",
				cookie: "",
				navigatorLanguage: "fr-FR",
			}),
		).toBe("zh-CN");
	});

	it("writes locale cookie with expected key and attributes", () => {
		const fakeDocument = { cookie: "" };
		vi.stubGlobal("document", fakeDocument);

		setLocaleCookie("en-US");

		expect(fakeDocument.cookie).toContain("illumi_locale=en-US");
		expect(fakeDocument.cookie).toContain("path=/");
		expect(fakeDocument.cookie).toContain("max-age=31536000");
	});

	it("updates URL query lang when switching locale", () => {
		const replaceState = vi.fn();
		vi.stubGlobal("window", {
			location: { href: "https://illumi-family.com/admin/profile?foo=1" },
			history: {
				state: { from: "test" },
				replaceState,
			},
		});

		setLangQuery("en-US");
		expect(replaceState).toHaveBeenCalledWith(
			{ from: "test" },
			"",
			"https://illumi-family.com/admin/profile?foo=1&lang=en",
		);
	});
});
