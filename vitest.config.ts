import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src/react-app", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		include: [
			"src/**/*.test.ts",
			"src/**/*.test.tsx",
			"tools/create-illumi-family-app/*.test.ts",
		],
	},
});
