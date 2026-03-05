import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password-hasher";

describe("password hasher", () => {
	it("hashes and verifies a password", async () => {
		const hashed = await hashPassword("Passw0rd!A123");
		expect(hashed).toContain("pbkdf2$");
		await expect(
			verifyPassword({
				hash: hashed,
				password: "Passw0rd!A123",
			}),
		).resolves.toBe(true);
	});

	it("rejects a wrong password", async () => {
		const hashed = await hashPassword("Passw0rd!A123");
		await expect(
			verifyPassword({
				hash: hashed,
				password: "WrongPassword!999",
			}),
		).resolves.toBe(false);
	});
});
