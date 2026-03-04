import type { AppBindings } from "../types";
import { AppError } from "../shared/http/errors";

const VALID_ENV = new Set(["dev", "prod"] as const);

export const readRuntimeEnv = (env: AppBindings) => {
	if (!VALID_ENV.has(env.APP_ENV as "dev" | "prod")) {
		throw new AppError("CONFIG_ERROR", "APP_ENV must be dev or prod", 500);
	}

	return {
		appEnv: env.APP_ENV as "dev" | "prod",
		apiVersion: env.API_VERSION,
	};
};
