import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listStreamVideos } from "./stream-client";

describe("stream client list api", () => {
	const fetchMock = vi.fn<typeof fetch>();

	beforeEach(() => {
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		fetchMock.mockReset();
		vi.unstubAllGlobals();
	});

	it("parses list payload when Cloudflare returns result as object", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					result: {
						videos: [
							{
								uid: "stream-1",
								readyToStream: true,
								status: { state: "ready" },
							},
						],
						total: 7,
						range: 7,
					},
					errors: [],
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const result = await listStreamVideos(
			{
				STREAM_ACCOUNT_ID: "account-1",
				STREAM_API_TOKEN: "token-1",
			} as never,
			{ limit: 3, includeCounts: true },
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.cloudflare.com/client/v4/accounts/account-1/stream?limit=3&include_counts=true",
			expect.objectContaining({
				method: "GET",
			}),
		);
		expect(result.videos).toHaveLength(1);
		expect(result.total).toBe(7);
		expect(result.range).toBe(7);
	});

	it("parses list payload when Cloudflare returns result as array", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					result: [
						{
							uid: "stream-2",
							readyToStream: true,
							status: { state: "ready" },
						},
					],
					total: 5,
					range: 5,
					errors: [],
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const result = await listStreamVideos(
			{
				STREAM_ACCOUNT_ID: "account-2",
				STREAM_API_TOKEN: "token-2",
			} as never,
			{ limit: 2 },
		);

		expect(result.videos).toHaveLength(1);
		expect(result.total).toBe(5);
		expect(result.range).toBe(5);
	});
});
