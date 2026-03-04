import { readRuntimeEnv } from "../../config/env";
import type { AppBindings } from "../../types";

export const buildHealthPayload = (env: AppBindings) => {
	const runtime = readRuntimeEnv(env);

	return {
		status: "ok",
		appEnv: runtime.appEnv,
		apiVersion: runtime.apiVersion,
		timestamp: new Date().toISOString(),
	};
};
