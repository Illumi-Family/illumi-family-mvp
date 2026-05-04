import { describe, expect, it } from "vitest";
import { isDeleteDraftConfirmationMatch } from "./admin-videos-page.delete-confirm";

describe("admin videos delete confirmation matcher", () => {
	it("returns true only when input exactly equals stream video id", () => {
		expect(isDeleteDraftConfirmationMatch("stream-123", "stream-123")).toBe(true);
		expect(isDeleteDraftConfirmationMatch(" stream-123", "stream-123")).toBe(
			false,
		);
		expect(isDeleteDraftConfirmationMatch("stream-123 ", "stream-123")).toBe(
			false,
		);
		expect(isDeleteDraftConfirmationMatch("STREAM-123", "stream-123")).toBe(
			false,
		);
		expect(isDeleteDraftConfirmationMatch("", "stream-123")).toBe(false);
	});
});
