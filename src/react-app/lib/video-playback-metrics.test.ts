import { describe, expect, it } from "vitest";
import {
	beginVideoPlaybackMetricSession,
	clearVideoPlaybackMetricsForTest,
	getVideoPlaybackMetricEvents,
	markVideoPlaybackMetric,
} from "./video-playback-metrics";

describe("video-playback-metrics", () => {
	it("records cold-start click -> loadeddata -> playing timeline", () => {
		clearVideoPlaybackMetricsForTest();
		const sessionId = beginVideoPlaybackMetricSession({
			streamVideoId: "stream-1",
			startupKind: "cold",
			surface: "video-modal",
			now: 10,
		});

		markVideoPlaybackMetric(sessionId, "loadeddata", 42);
		markVideoPlaybackMetric(sessionId, "playing", 73);

		const events = getVideoPlaybackMetricEvents().filter(
			(event) => event.sessionId === sessionId,
		);
		expect(events.map((event) => event.event)).toEqual([
			"click",
			"loadeddata",
			"playing",
		]);
		expect(events.every((event) => event.startupKind === "cold")).toBe(true);
		expect(events.every((event) => event.surface === "video-modal")).toBe(true);
		expect(events[1]?.elapsedMs).toBe(32);
		expect(events[2]?.elapsedMs).toBe(63);
	});

	it("keeps session valid when only loadeddata arrives", () => {
		clearVideoPlaybackMetricsForTest();
		const sessionId = beginVideoPlaybackMetricSession({
			streamVideoId: "stream-2",
			startupKind: "warm",
			surface: "video-modal",
			now: 100,
		});

		markVideoPlaybackMetric(sessionId, "loadeddata", 144);

		const events = getVideoPlaybackMetricEvents().filter(
			(event) => event.sessionId === sessionId,
		);
		expect(events).toHaveLength(2);
		expect(events[1]?.event).toBe("loadeddata");
		expect(events[1]?.startupKind).toBe("warm");
		expect(events[1]?.surface).toBe("video-modal");
		expect(events[1]?.elapsedMs).toBe(44);
	});

	it("records error event with startup stage", () => {
		clearVideoPlaybackMetricsForTest();
		const sessionId = beginVideoPlaybackMetricSession({
			streamVideoId: "stream-err",
			startupKind: "cold",
			surface: "video-modal",
			now: 500,
		});

		markVideoPlaybackMetric(sessionId, "error", 560);

		const events = getVideoPlaybackMetricEvents().filter(
			(event) => event.sessionId === sessionId,
		);
		expect(events.map((event) => event.event)).toEqual(["click", "error"]);
		expect(events[1]?.elapsedMs).toBe(60);
	});

	it("supports home-main play_intent and loadstart timeline", () => {
		clearVideoPlaybackMetricsForTest();
		const sessionId = beginVideoPlaybackMetricSession({
			streamVideoId: "stream-home-1",
			startupKind: "warm",
			surface: "home-main",
			intentEvent: "play_intent",
			now: 200,
		});

		markVideoPlaybackMetric(sessionId, "loadstart", 206);
		markVideoPlaybackMetric(sessionId, "loadeddata", 240);
		markVideoPlaybackMetric(sessionId, "playing", 272);

		const events = getVideoPlaybackMetricEvents().filter(
			(event) => event.sessionId === sessionId,
		);
		expect(events.map((event) => event.event)).toEqual([
			"play_intent",
			"loadstart",
			"loadeddata",
			"playing",
		]);
		expect(events.every((event) => event.surface === "home-main")).toBe(true);
		expect(events[1]?.elapsedMs).toBe(6);
		expect(events[3]?.elapsedMs).toBe(72);
	});
});
