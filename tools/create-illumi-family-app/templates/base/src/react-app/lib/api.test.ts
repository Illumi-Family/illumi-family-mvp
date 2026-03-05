import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createUser, getHealth, listUsers } from "./api";

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

	it("creates user with JSON body and returns new user", async () => {
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
				{ status: 201, headers: { "content-type": "application/json" } },
			),
		);

		const user = await createUser({
			name: "Alice",
			email: "alice@example.com",
		});

		expect(fetchMock).toHaveBeenCalledWith("/api/users", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name: "Alice",
				email: "alice@example.com",
			}),
		});
		expect(user.name).toBe("Alice");
	});

	it("throws structured error when API response is unsuccessful", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: false,
					error: {
						code: "USER_EMAIL_TAKEN",
						message: "Email already exists",
					},
					requestId: "req-3",
				}),
				{ status: 409, headers: { "content-type": "application/json" } },
			),
		);

		await expect(listUsers()).rejects.toThrow(
			"USER_EMAIL_TAKEN: Email already exists",
		);
	});
});
