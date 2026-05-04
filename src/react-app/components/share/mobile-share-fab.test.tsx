import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mockUseState = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
	const actual = await vi.importActual<typeof import("react")>("react");
	return {
		...actual,
		useState: mockUseState,
	};
});

import { MobileShareFab } from "./mobile-share-fab";

describe("mobile share fab", () => {
	it("renders floating share trigger and keeps sheet closed by default", () => {
		const setBooleanState = vi.fn();
		const setTextState = vi.fn();
		mockUseState
			.mockReturnValueOnce([false, setBooleanState])
			.mockReturnValueOnce([null, setTextState]);

		const html = renderToStaticMarkup(createElement(MobileShareFab));

		expect(html).toContain("打开微信分享");
		expect(html).not.toContain("点击微信右上角");
	});
});
