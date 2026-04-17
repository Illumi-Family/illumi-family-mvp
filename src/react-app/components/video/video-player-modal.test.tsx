import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@cloudflare/stream-react", () => ({
	Stream: (props: { src: string; poster?: string }) =>
		createElement("div", {
			"data-testid": "stream-player",
			"data-src": props.src,
			"data-poster": props.poster ?? "",
		}),
}));

import { VideoPlayerModal } from "./video-player-modal";
import {
	getVideoPlayerOverlayMode,
	reduceVideoPlayerStartupPhase,
} from "./video-player-modal-state";

describe("video-player-modal", () => {
	it("transitions to playing when loadeddata arrives", () => {
		const phase = reduceVideoPlayerStartupPhase("loading", "loadeddata");
		expect(phase).toBe("playing");
		expect(getVideoPlayerOverlayMode(phase)).toBe("hidden");
	});

	it("returns to loading when retrying from error state", () => {
		const failed = reduceVideoPlayerStartupPhase("loading", "error");
		const retried = reduceVideoPlayerStartupPhase(failed, "retry");
		expect(failed).toBe("error");
		expect(retried).toBe("loading");
		expect(getVideoPlayerOverlayMode(retried)).toBe("loading");
	});

	it("renders non-black fallback when poster is missing", () => {
		const html = renderToStaticMarkup(
			createElement(VideoPlayerModal, {
				open: true,
				onClose: () => {},
				streamVideoId: "stream-1",
				videoTitle: "家庭课程",
				posterUrl: null,
			}),
		);

		expect(html).toContain("正在加载视频");
		expect(html).toContain("封面准备中");
		expect(html).toContain('data-testid="stream-player"');
	});

	it("renders recoverable error message when stream id is missing", () => {
		const html = renderToStaticMarkup(
			createElement(VideoPlayerModal, {
				open: true,
				onClose: () => {},
				streamVideoId: null,
				videoTitle: "家庭课程",
				posterUrl: null,
			}),
		);

		expect(html).toContain("视频暂时不可用");
		expect(html).toContain("重试");
		expect(html).toContain("关闭");
	});
});
