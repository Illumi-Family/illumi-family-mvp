import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/worker/shared/db/schema/*.ts",
	out: "./drizzle/migrations",
	verbose: true,
	strict: true,
});
