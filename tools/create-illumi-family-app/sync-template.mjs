import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

const DEFAULT_CONFIG_PATH = resolve(process.cwd(), "template.config.json");

const normalizePath = (value) => value.split("\\").join("/");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
		apply: false,
		dryRun: true,
		force: false,
		config: DEFAULT_CONFIG_PATH,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--") {
			continue;
		}

		if (arg === "--apply") {
			options.apply = true;
			options.dryRun = false;
			continue;
		}

		if (arg === "--dry-run") {
			options.dryRun = true;
			options.apply = false;
			continue;
		}

		if (arg === "--force") {
			options.force = true;
			continue;
		}

		if (arg === "--config" || arg.startsWith("--config=")) {
			const { value, consumed } = parseOptionValue(arg, argv, i);
			options.config = resolve(process.cwd(), value.trim());
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
	const sourceRoot = dirname(configPath);
	const templateDir = isAbsolute(parsed.templateDir)
		? parsed.templateDir
		: resolve(sourceRoot, parsed.templateDir);
	const manifestFile = parsed.manifestFile ?? "template.manifest.json";

	return {
		...parsed,
		sourceRoot,
		templateDir,
		manifestFile,
	};
};

const isBlacklisted = (relativePath, blacklist) => {
	const rel = normalizePath(relativePath);

	for (const rawPattern of blacklist) {
		const pattern = normalizePath(rawPattern);
		if (!pattern) {
			continue;
		}

		if (pattern.includes("*")) {
			const regex = new RegExp(
				`^${escapeRegex(pattern).replace(/\\\*/g, "[^/]*")}(?:$|/.*)`,
			);
			if (regex.test(rel)) {
				return true;
			}
			continue;
		}

		if (rel === pattern || rel.startsWith(`${pattern}/`)) {
			return true;
		}
	}

	return false;
};

const hashFile = (filePath) =>
	createHash("sha256").update(readFileSync(filePath)).digest("hex");

const collectFilesFromEntry = ({
	sourceRoot,
	currentRelativePath,
	blacklist,
	map,
}) => {
	const relativePath = normalizePath(currentRelativePath);
	if (isBlacklisted(relativePath, blacklist)) {
		return;
	}

	const absolutePath = resolve(sourceRoot, relativePath);
	if (!existsSync(absolutePath)) {
		return;
	}

	const stats = statSync(absolutePath);
	if (stats.isFile()) {
		map.set(relativePath, {
			absolutePath,
			hash: hashFile(absolutePath),
			updatedAt: stats.mtime.toISOString(),
		});
		return;
	}

	if (!stats.isDirectory()) {
		return;
	}

	const children = readdirSync(absolutePath).sort((left, right) =>
		left.localeCompare(right),
	);
	for (const child of children) {
		const childRelative = relativePath
			? `${relativePath}/${child}`
			: normalizePath(child);
		collectFilesFromEntry({
			sourceRoot,
			currentRelativePath: childRelative,
			blacklist,
			map,
		});
	}
};

const collectTemplateFiles = ({ templateDir, manifestFile }) => {
	const files = new Map();
	if (!existsSync(templateDir)) {
		return files;
	}

	const walk = (relativeDir) => {
		const directory = resolve(templateDir, relativeDir);
		const entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
			left.name.localeCompare(right.name),
		);

		for (const entry of entries) {
			const relPath = relativeDir
				? normalizePath(`${relativeDir}/${entry.name}`)
				: normalizePath(entry.name);

			if (entry.isDirectory()) {
				walk(relPath);
				continue;
			}

			if (relPath === manifestFile) {
				continue;
			}

			const absolutePath = resolve(templateDir, relPath);
			files.set(relPath, {
				absolutePath,
				hash: hashFile(absolutePath),
			});
		}
	};

	walk("");
	return files;
};

const ensureGitClean = ({ sourceRoot, force }) => {
	if (force) {
		return;
	}

	const result = spawnSync("git", ["status", "--porcelain"], {
		cwd: sourceRoot,
		encoding: "utf8",
	});
	if (result.status !== 0) {
		return;
	}
	if (result.stdout.trim().length > 0) {
		throw new Error(
			"Repository has uncommitted changes. Re-run with --force to continue.",
		);
	}
};

const formatOps = (label, paths) => {
	for (const path of paths) {
		console.log(`[${label}] ${path}`);
	}
};

const writeManifest = ({ templateDir, manifestFile, sourceFiles }) => {
	const generatedAt = new Date().toISOString();
	const files = Array.from(sourceFiles.entries())
		.sort((left, right) => left[0].localeCompare(right[0]))
		.map(([path, details]) => ({
			path,
			hash: details.hash,
			updatedAt: details.updatedAt,
		}));

	const manifest = {
		generatedAt,
		files,
	};

	writeFileSync(
		join(templateDir, manifestFile),
		`${JSON.stringify(manifest, null, 2)}\n`,
		"utf8",
	);
};

const applyChanges = ({ templateDir, writes, removals }) => {
	for (const relativePath of removals) {
		rmSync(resolve(templateDir, relativePath), { force: true });
	}

	for (const { path, sourceAbsolutePath } of writes) {
		const destination = resolve(templateDir, path);
		mkdirSync(dirname(destination), { recursive: true });
		copyFileSync(sourceAbsolutePath, destination);
	}
};

const runSync = (options, config) => {
	const whitelist = Array.isArray(config.sync?.whitelist)
		? config.sync.whitelist
		: [];
	const blacklist = Array.isArray(config.sync?.blacklist)
		? config.sync.blacklist
		: [];

	if (whitelist.length === 0) {
		throw new Error("sync whitelist is empty. Check template.config.json");
	}

	const sourceFiles = new Map();
	for (const entry of whitelist) {
		collectFilesFromEntry({
			sourceRoot: config.sourceRoot,
			currentRelativePath: normalizePath(entry),
			blacklist,
			map: sourceFiles,
		});
	}

	const templateFiles = collectTemplateFiles({
		templateDir: config.templateDir,
		manifestFile: config.manifestFile,
	});

	const writePaths = [];
	for (const [path, sourceInfo] of sourceFiles.entries()) {
		const templateInfo = templateFiles.get(path);
		if (!templateInfo || templateInfo.hash !== sourceInfo.hash) {
			writePaths.push({
				path,
				sourceAbsolutePath: sourceInfo.absolutePath,
			});
		}
	}

	const removals = [];
	for (const path of templateFiles.keys()) {
		if (!sourceFiles.has(path)) {
			removals.push(path);
		}
	}

	writePaths.sort((left, right) => left.path.localeCompare(right.path));
	removals.sort((left, right) => left.localeCompare(right));

	if (options.dryRun) {
		console.log("template:sync dry-run");
		formatOps("WRITE", writePaths.map((item) => item.path));
		formatOps("REMOVE", removals);
		console.log(
			`dry-run summary: ${writePaths.length} to write, ${removals.length} to remove`,
		);
		return;
	}

	ensureGitClean({ sourceRoot: config.sourceRoot, force: options.force });
	mkdirSync(config.templateDir, { recursive: true });
	applyChanges({
		templateDir: config.templateDir,
		writes: writePaths,
		removals,
	});
	writeManifest({
		templateDir: config.templateDir,
		manifestFile: config.manifestFile,
		sourceFiles,
	});

	console.log("Applied template sync");
	console.log(
		`sync summary: ${writePaths.length} written, ${removals.length} removed`,
	);
};

const main = () => {
	try {
		const options = parseArgs(process.argv.slice(2));
		const config = loadConfig(options.config);
		runSync(options, config);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(message);
		process.exit(1);
	}
};

main();
