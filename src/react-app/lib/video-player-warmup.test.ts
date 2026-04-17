import { afterEach, describe, expect, it, vi } from "vitest";
import {
	hasVideoPlaybackWarmupHit,
	resetVideoPlayerWarmupStateForTest,
	scheduleVideoPlayerSdkWarmup,
	warmupVideoPlaybackIntent,
} from "./video-player-warmup";

type FakeLinkElement = {
	rel: string;
	href: string;
	as?: string;
};

const createFakeDocument = () => {
	const links: FakeLinkElement[] = [];
	const documentStub = {
		head: {
			appendChild(node: FakeLinkElement) {
				links.push({ ...node });
			},
		},
		createElement(tagName: string) {
			if (tagName !== "link") {
				throw new Error("unexpected element");
			}
			return { rel: "", href: "", as: "" };
		},
	};

	return { links, documentStub };
};

describe("video-player-warmup", () => {
	afterEach(() => {
		resetVideoPlayerWarmupStateForTest();
		vi.unstubAllGlobals();
	});

	it("schedules sdk warmup once and stays idempotent", () => {
		const { links, documentStub } = createFakeDocument();
		vi.stubGlobal("document", documentStub);
		vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
			callback();
			return 1;
		});

		expect(scheduleVideoPlayerSdkWarmup()).toBe(true);
		expect(scheduleVideoPlayerSdkWarmup()).toBe(false);
		expect(
			links.filter(
				(link) =>
					link.rel === "preload" &&
					link.as === "script" &&
					link.href === "https://embed.videodelivery.net/embed/sdk.latest.js",
			),
		).toHaveLength(1);
	});

	it("returns safely in non-browser context", () => {
		expect(scheduleVideoPlayerSdkWarmup()).toBe(false);
		expect(warmupVideoPlaybackIntent("video-1")).toBe(false);
		expect(hasVideoPlaybackWarmupHit("video-1")).toBe(false);
	});

	it("degrades intent warmup on constrained network", () => {
		const { links, documentStub } = createFakeDocument();
		vi.stubGlobal("document", documentStub);
		vi.stubGlobal("navigator", {
			connection: {
				saveData: true,
				effectiveType: "4g",
			},
		});

		expect(warmupVideoPlaybackIntent("video-1")).toBe(false);
		expect(hasVideoPlaybackWarmupHit("video-1")).toBe(false);
		expect(links).toHaveLength(0);
	});

	it("does not throw when sdk preload injection fails", () => {
		const documentStub = {
			head: {
				appendChild() {
					throw new Error("append failed");
				},
			},
			createElement() {
				return { rel: "", href: "", as: "" };
			},
		};
		vi.stubGlobal("document", documentStub);
		vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
			callback();
			return 1;
		});

		expect(() => scheduleVideoPlayerSdkWarmup()).not.toThrow();
	});

	it("keeps intent warmup idempotent across duplicate triggers", () => {
		const { links, documentStub } = createFakeDocument();
		vi.stubGlobal("document", documentStub);
		vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
			callback();
			return 1;
		});
		vi.stubGlobal("navigator", {
			connection: {
				saveData: false,
				effectiveType: "4g",
			},
		});

		expect(warmupVideoPlaybackIntent("video-1")).toBe(true);
		expect(warmupVideoPlaybackIntent("video-1")).toBe(false);
		expect(hasVideoPlaybackWarmupHit("video-1")).toBe(true);
		expect(
			links.filter(
				(link) =>
					link.rel === "prefetch" &&
					link.as === "document" &&
					link.href === "https://iframe.videodelivery.net/video-1",
			),
		).toHaveLength(1);
	});
});
