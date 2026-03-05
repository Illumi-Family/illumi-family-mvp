import { existsSync } from "node:fs";
import { expect, test } from "vitest";

test("scaffold scripts should exist", () => {
	expect(existsSync("tools/create-illumi-family-app/create.mjs")).toBe(true);
	expect(existsSync("tools/create-illumi-family-app/sync-template.mjs")).toBe(
		true,
	);
});
