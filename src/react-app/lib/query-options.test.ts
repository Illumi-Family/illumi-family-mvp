import { describe, expect, it } from "vitest";
import {
	adminVideosQueryOptions,
	homeContentQueryKey,
	homeContentQueryOptions,
	publicVideosQueryOptions,
} from "./query-options";

describe("home content query options", () => {
	it("shards query key by locale", () => {
		expect(homeContentQueryKey("zh-CN")).toEqual(["home-content", "zh-CN"]);
		expect(homeContentQueryKey("en-US")).toEqual(["home-content", "en-US"]);
		expect(homeContentQueryKey("zh-CN")).not.toEqual(homeContentQueryKey("en-US"));
	});

	it("uses locale-aware key in query options", () => {
		expect(homeContentQueryOptions("en-US").queryKey).toEqual(["home-content", "en-US"]);
		expect(homeContentQueryOptions("zh-CN").queryKey).toEqual(["home-content", "zh-CN"]);
	});

	it("uses stable key for admin videos query options", () => {
		expect(adminVideosQueryOptions().queryKey).toEqual(["admin-videos"]);
	});

	it("uses stable key for public videos query options", () => {
		expect(publicVideosQueryOptions().queryKey).toEqual(["public-videos"]);
	});
});
