import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { AppBindings } from "../../types";
import * as schema from "./schema";

export type AppDatabase = DrizzleD1Database<typeof schema>;

export const getDb = (env: AppBindings): AppDatabase =>
	drizzle(env.DB, { schema });
