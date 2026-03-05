import { spawnSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_CONFIG_PATH = resolve(process.cwd(), "template.config.json");
const TOOL_DIR = dirname(fileURLToPath(import.meta.url));

const parseOptionValue = (arg, args, index) => {
	const [key, inlineValue] = arg.split("=", 2);
	if (inlineValue) {
		return { key, value: inlineValue, consumed: 0 };
	}

	const next = args[index + 1];
	if (!next || next.startsWith("--")) {
		throw new Error(`${key} requires a value`);
	}

	return { key, value: next, consumed: 1 };
};

const parseArgs = (argv) => {
	const options = {
		name: "",
		dir: "",
		overwrite: false,
		noInstall: false,
		doctor: false,
		config: DEFAULT_CONFIG_PATH,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--") {
			continue;
		}

		if (arg === "--overwrite") {
			options.overwrite = true;
			continue;
		}

		if (arg === "--no-install") {
			options.noInstall = true;
			continue;
		}

		if (arg === "--doctor") {
			options.doctor = true;
			continue;
		}

		if (
			arg === "--name" ||
			arg.startsWith("--name=") ||
			arg === "--dir" ||
			arg.startsWith("--dir=") ||
			arg === "--config" ||
			arg.startsWith("--config=")
		) {
			const { key, value, consumed } = parseOptionValue(arg, argv, i);
			if (key === "--name") {
				options.name = value.trim();
			}
			if (key === "--dir") {
				options.dir = value.trim();
			}
			if (key === "--config") {
				options.config = resolve(process.cwd(), value.trim());
			}
			i += consumed;
			continue;
		}

		throw new Error(`Unknown option: ${arg}`);
	}

	return options;
};

const loadConfig = (configPath) => {
	if (!existsSync(configPath)) {
		throw new Error(`Config file not found: ${configPath}`);
	}

	const raw = readFileSync(configPath, "utf8");
	const parsed = JSON.parse(raw);
	const templateDir = isAbsolute(parsed.templateDir)
		? parsed.templateDir
		: resolve(dirname(configPath), parsed.templateDir);

	return {
		...parsed,
		templateDir,
		manifestPath: join(templateDir, parsed.manifestFile ?? "template.manifest.json"),
	};
};

const toWorkerName = (projectName) => {
	const normalized = projectName
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "");

	if (!normalized) {
		throw new Error("Invalid --name. It must contain letters or numbers.");
	}

	return normalized;
};

const ensureTargetIsWritable = (targetDir, overwrite) => {
	if (!existsSync(targetDir)) {
		return;
	}

	const entries = readdirSync(targetDir);
	if (entries.length > 0 && !overwrite) {
		throw new Error("Target directory is not empty. Use --overwrite to continue.");
	}
};

const writeJson = (filePath, updater) => {
	if (!existsSync(filePath)) {
		return;
	}

	const json = JSON.parse(readFileSync(filePath, "utf8"));
	const nextValue = updater(json);
	writeFileSync(filePath, `${JSON.stringify(nextValue, null, 2)}\n`, "utf8");
};

const runDoctor = (config) => {
	const requiredTemplateFiles = ["package.json", "wrangler.json", "README.md"];
	const checks = [
		{
			label: "create.mjs",
			ok: existsSync(join(TOOL_DIR, "create.mjs")),
		},
		{
			label: "sync-template.mjs",
			ok: existsSync(join(TOOL_DIR, "sync-template.mjs")),
		},
		{
			label: "template directory",
			ok: existsSync(config.templateDir),
		},
		{
			label: "template manifest",
			ok: existsSync(config.manifestPath),
		},
		...requiredTemplateFiles.map((file) => ({
			label: `template file ${file}`,
			ok: existsSync(join(config.templateDir, file)),
		})),
	];

	const failed = checks.filter((check) => !check.ok);
	for (const check of checks) {
		const status = check.ok ? "OK" : "MISSING";
		console.log(`[${status}] ${check.label}`);
	}

	if (failed.length > 0) {
		console.error("template:doctor failed");
		return 1;
	}

	console.log("template:doctor passed");
	return 0;
};

const runCreate = (options, config) => {
	if (!options.name) {
		throw new Error("--name is required");
	}

	if (!existsSync(config.templateDir)) {
		throw new Error(`Template directory does not exist: ${config.templateDir}`);
	}

	const projectName = options.name;
	const workerName = toWorkerName(projectName);
	const targetDir = resolve(
		process.cwd(),
		options.dir || resolve(process.cwd(), "..", projectName),
	);

	ensureTargetIsWritable(targetDir, options.overwrite);
	mkdirSync(targetDir, { recursive: true });

	cpSync(config.templateDir, targetDir, {
		recursive: true,
		force: options.overwrite,
		errorOnExist: !options.overwrite,
	});

	writeJson(join(targetDir, "package.json"), (json) => {
		const scripts = { ...(json.scripts ?? {}) };
		for (const scriptName of Object.keys(scripts)) {
			if (scriptName.startsWith("template:")) {
				delete scripts[scriptName];
			}
		}

		return {
			...json,
			name: projectName,
			scripts,
		};
	});

	writeJson(join(targetDir, "wrangler.json"), (json) => {
		const next = { ...json, name: workerName };
		if (next.env?.dev && typeof next.env.dev === "object") {
			next.env = {
				...next.env,
				dev: {
					...next.env.dev,
					name: `${workerName}-dev`,
				},
			};
		}
		return next;
	});

	const readmePath = join(targetDir, "README.md");
	if (existsSync(readmePath) && config.replacements?.readmeTitle?.from) {
		const readme = readFileSync(readmePath, "utf8");
		const replaced = readme.replaceAll(
			config.replacements.readmeTitle.from,
			projectName,
		);
		writeFileSync(readmePath, replaced, "utf8");
	}

	const generatedManifestPath = join(
		targetDir,
		config.manifestFile ?? "template.manifest.json",
	);
	rmSync(generatedManifestPath, { force: true });

	if (!options.noInstall) {
		const install = spawnSync("pnpm", ["install"], {
			cwd: targetDir,
			stdio: "inherit",
		});
		if (install.status !== 0) {
			throw new Error("Dependency installation failed. Re-run with --no-install.");
		}
	}

	console.log(`Created template project at ${targetDir}`);
};

const main = () => {
	try {
		const options = parseArgs(process.argv.slice(2));
		const config = loadConfig(options.config);

		if (options.doctor) {
			process.exit(runDoctor(config));
		}

		runCreate(options, config);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(message);
		process.exit(1);
	}
};

main();
