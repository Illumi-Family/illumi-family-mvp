import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, getHealth, updateCurrentUser } from "./api";

describe("react api client", () => {
	const fetchMock = vi.fn<typeof fetch>();

	beforeEach(() => {
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		fetchMock.mockReset();
		vi.unstubAllGlobals();
	});

	it("loads health payload from /api/health", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						status: "ok",
						appEnv: "dev",
						apiVersion: "v1",
						timestamp: "2026-03-04T12:00:00.000Z",
					},
					requestId: "req-1",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const result = await getHealth();

		expect(fetchMock).toHaveBeenCalledWith("/api/health", {
			headers: { Accept: "application/json" },
		});
		expect(result.status).toBe("ok");
		expect(result.appEnv).toBe("dev");
	});

	it("loads current user from /api/users/me", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						user: {
							id: "u-1",
							name: "Alice",
							email: "alice@example.com",
							createdAt: "2026-03-04T12:00:00.000Z",
							updatedAt: "2026-03-04T12:00:00.000Z",
						},
					},
					requestId: "req-2",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const user = await getCurrentUser();

		expect(fetchMock).toHaveBeenCalledWith("/api/users/me", {
			headers: {
				Accept: "application/json",
			},
		});
		expect(user.name).toBe("Alice");
	});

	it("updates current user with PATCH /api/users/me", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						user: {
							id: "u-1",
							name: "Alice Smith",
							email: "alice@example.com",
							createdAt: "2026-03-04T12:00:00.000Z",
							updatedAt: "2026-03-04T12:30:00.000Z",
						},
					},
					requestId: "req-3",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const user = await updateCurrentUser({
			name: "Alice Smith",
		});

		expect(fetchMock).toHaveBeenCalledWith("/api/users/me", {
			method: "PATCH",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name: "Alice Smith",
			}),
		});
		expect(user.name).toBe("Alice Smith");
	});

	it("throws structured error when current user is unavailable", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: false,
					error: {
						code: "CURRENT_USER_NOT_FOUND",
						message: "Current user is not available",
					},
					requestId: "req-4",
				}),
				{ status: 404, headers: { "content-type": "application/json" } },
			),
		);

		await expect(getCurrentUser()).rejects.toThrow(
			"CURRENT_USER_NOT_FOUND: Current user is not available",
		);
	});
});
