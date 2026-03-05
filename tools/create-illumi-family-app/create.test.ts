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
import { afterEach, describe, expect, it } from "vitest";

const scriptPath = resolve(
	process.cwd(),
	"tools/create-illumi-family-app/create.mjs",
);
const tempDirs: string[] = [];

const createTempDir = (name: string) => {
	const tempDir = mkdtempSync(join(tmpdir(), `${name}-`));
	tempDirs.push(tempDir);
	return tempDir;
};

const runCreate = (...args: string[]) =>
	spawnSync(process.execPath, [scriptPath, ...args], {
		cwd: process.cwd(),
		encoding: "utf8",
	});

afterEach(() => {
	for (const dir of tempDirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

describe("template:new cli", () => {
	it("requires --name", () => {
		const result = runCreate();

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("--name is required");
	});

	it("rejects non-empty target directory by default", () => {
		const fixtureRoot = createTempDir("template-new-guard");
		const templateDir = join(fixtureRoot, "template-base");
		const targetDir = join(fixtureRoot, "target");
		const configPath = join(fixtureRoot, "template.config.json");

		mkdirSync(templateDir, { recursive: true });
		mkdirSync(targetDir, { recursive: true });
		writeFileSync(join(targetDir, "keep.txt"), "do not overwrite\n");
		writeFileSync(
			configPath,
			JSON.stringify(
				{
					templateDir,
					manifestFile: "template.manifest.json",
					sync: { whitelist: [], blacklist: [] },
					replacements: { readmeTitle: { from: "illumi-family-mvp" } },
				},
				null,
				2,
			),
		);

		const result = runCreate(
			"--",
			"--config",
			configPath,
			"--name",
			"my-app",
			"--dir",
			targetDir,
			"--no-install",
		);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Target directory is not empty");
	});

	it("copies base template and replaces project identifiers", () => {
		const fixtureRoot = createTempDir("template-new-copy");
		const templateDir = join(fixtureRoot, "template-base");
		const targetDir = join(fixtureRoot, "output");
		const configPath = join(fixtureRoot, "template.config.json");

		mkdirSync(templateDir, { recursive: true });
		writeFileSync(
			join(templateDir, "package.json"),
			JSON.stringify(
				{
					name: "illumi-family-mvp",
					private: true,
					scripts: { test: "vitest run" },
				},
				null,
				2,
			),
		);
		writeFileSync(
			join(templateDir, "wrangler.json"),
			JSON.stringify(
				{
					name: "illumi-family-mvp",
					env: {
						dev: {
							name: "illumi-family-mvp-dev",
						},
					},
				},
				null,
				2,
			),
		);
		writeFileSync(join(templateDir, "README.md"), "# illumi-family-mvp\n");
		writeFileSync(
			configPath,
			JSON.stringify(
				{
					templateDir,
					manifestFile: "template.manifest.json",
					sync: { whitelist: [], blacklist: [] },
					replacements: { readmeTitle: { from: "illumi-family-mvp" } },
				},
				null,
				2,
			),
		);

		const result = runCreate(
			"--",
			"--config",
			configPath,
			"--name",
			"my-app",
			"--dir",
			targetDir,
			"--no-install",
		);

		expect(result.status).toBe(0);
		expect(result.stdout).toContain("Created template project");

		const generatedPackage = JSON.parse(
			readFileSync(join(targetDir, "package.json"), "utf8"),
		) as { name: string; scripts?: Record<string, string> };
		const generatedWrangler = JSON.parse(
			readFileSync(join(targetDir, "wrangler.json"), "utf8"),
		) as { name: string; env?: { dev?: { name?: string } } };
		const generatedReadme = readFileSync(join(targetDir, "README.md"), "utf8");

		expect(generatedPackage.name).toBe("my-app");
		expect(generatedPackage.scripts?.["template:new"]).toBeUndefined();
		expect(generatedPackage.scripts?.["template:sync"]).toBeUndefined();
		expect(generatedPackage.scripts?.["template:doctor"]).toBeUndefined();
		expect(generatedWrangler.name).toBe("my-app");
		expect(generatedWrangler.env?.dev?.name).toBe("my-app-dev");
		expect(generatedReadme).toContain("my-app");
		expect(() =>
			readFileSync(join(targetDir, "template.manifest.json"), "utf8"),
		).toThrow();
	});

	it("doctor returns non-zero when template is incomplete", () => {
		const fixtureRoot = createTempDir("template-doctor-fail");
		const templateDir = join(fixtureRoot, "template-base");
		const configPath = join(fixtureRoot, "template.config.json");

		mkdirSync(templateDir, { recursive: true });
		writeFileSync(
			configPath,
			JSON.stringify(
				{
					templateDir,
					manifestFile: "template.manifest.json",
					sync: { whitelist: [], blacklist: [] },
				},
				null,
				2,
			),
		);

		const result = runCreate("--doctor", "--config", configPath);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("template:doctor failed");
	});

	it("doctor passes when required template files and manifest exist", () => {
		const fixtureRoot = createTempDir("template-doctor-pass");
		const templateDir = join(fixtureRoot, "template-base");
		const configPath = join(fixtureRoot, "template.config.json");

		mkdirSync(templateDir, { recursive: true });
		writeFileSync(
			join(templateDir, "package.json"),
			JSON.stringify({ name: "illumi-family-mvp" }, null, 2),
		);
		writeFileSync(
			join(templateDir, "wrangler.json"),
			JSON.stringify({ name: "illumi-family-mvp" }, null, 2),
		);
		writeFileSync(join(templateDir, "README.md"), "# illumi-family-mvp\n");
		writeFileSync(
			join(templateDir, "template.manifest.json"),
			JSON.stringify(
				{
					generatedAt: new Date("2026-03-05T00:00:00.000Z").toISOString(),
					files: [],
				},
				null,
				2,
			),
		);
		writeFileSync(
			configPath,
			JSON.stringify(
				{
					templateDir,
					manifestFile: "template.manifest.json",
					sync: { whitelist: [], blacklist: [] },
				},
				null,
				2,
			),
		);

		const result = runCreate("--doctor", "--config", configPath);

		expect(result.status).toBe(0);
		expect(result.stdout).toContain("template:doctor passed");
	});
});
