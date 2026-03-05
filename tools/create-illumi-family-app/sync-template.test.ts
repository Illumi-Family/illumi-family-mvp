import { spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(
	process.cwd(),
	"tools/create-illumi-family-app/sync-template.mjs",
);

const createFixture = (name: string) => {
	const root = mkdtempSync(join(tmpdir(), `${name}-`));
	const templateDir = join(root, "template-base");
	const configPath = join(root, "template.config.json");

	mkdirSync(templateDir, { recursive: true });
	writeFileSync(
		configPath,
		JSON.stringify(
			{
				templateDir,
				manifestFile: "template.manifest.json",
				sync: {
					whitelist: ["src", "package.json", "tasks"],
					blacklist: ["tasks"],
				},
			},
			null,
			2,
		),
	);

	return {
		root,
		templateDir,
		configPath,
		cleanup: () => rmSync(root, { recursive: true, force: true }),
	};
};

const runSync = (args: string[]) =>
	spawnSync(process.execPath, [scriptPath, ...args], {
		cwd: process.cwd(),
		encoding: "utf8",
	});

describe("template:sync cli", () => {
	it("dry-run does not write template files", () => {
		const fixture = createFixture("template-sync-dry-run");
		try {
			mkdirSync(join(fixture.root, "src"), { recursive: true });
			writeFileSync(join(fixture.root, "src", "index.ts"), "export const v = 2;\n");
			writeFileSync(
				join(fixture.root, "package.json"),
				JSON.stringify({ name: "example" }, null, 2),
			);
			mkdirSync(join(fixture.templateDir, "src"), { recursive: true });
			writeFileSync(join(fixture.templateDir, "src", "index.ts"), "export const v = 1;\n");

			const result = runSync(["--", "--config", fixture.configPath, "--dry-run"]);
			const templateFile = readFileSync(
				join(fixture.templateDir, "src", "index.ts"),
				"utf8",
			);

			expect(result.status).toBe(0);
			expect(result.stdout).toContain("dry-run");
			expect(templateFile).toBe("export const v = 1;\n");
		} finally {
			fixture.cleanup();
		}
	});

	it("apply syncs whitelist files, respects blacklist, and creates manifest", () => {
		const fixture = createFixture("template-sync-apply");
		try {
			mkdirSync(join(fixture.root, "src"), { recursive: true });
			mkdirSync(join(fixture.root, "tasks"), { recursive: true });
			writeFileSync(join(fixture.root, "src", "index.ts"), "export const version = 3;\n");
			writeFileSync(
				join(fixture.root, "package.json"),
				JSON.stringify({ name: "my-template" }, null, 2),
			);
			writeFileSync(join(fixture.root, "tasks", "todo.md"), "# should not sync\n");

			mkdirSync(join(fixture.templateDir, "src"), { recursive: true });
			writeFileSync(join(fixture.templateDir, "src", "stale.ts"), "stale\n");

			const result = runSync(["--", "--config", fixture.configPath, "--apply"]);
			const syncedSrc = readFileSync(join(fixture.templateDir, "src", "index.ts"), "utf8");
			const syncedPackage = JSON.parse(
				readFileSync(join(fixture.templateDir, "package.json"), "utf8"),
			) as { name: string };
			const manifest = JSON.parse(
				readFileSync(
					join(fixture.templateDir, "template.manifest.json"),
					"utf8",
				),
			) as {
				generatedAt: string;
				files: Array<{ path: string; hash: string; updatedAt: string }>;
			};

			expect(result.status).toBe(0);
			expect(result.stdout).toContain("Applied template sync");
			expect(syncedSrc).toBe("export const version = 3;\n");
			expect(syncedPackage.name).toBe("my-template");
			expect(manifest.generatedAt).toBeTruthy();
			expect(manifest.files.some((item) => item.path === "src/index.ts")).toBe(
				true,
			);
			expect(
				manifest.files.every((item) => item.hash.length > 0 && item.updatedAt.length > 0),
			).toBe(true);
			expect(() =>
				readFileSync(join(fixture.templateDir, "tasks", "todo.md"), "utf8"),
			).toThrow();
		} finally {
			fixture.cleanup();
		}
	});
});
