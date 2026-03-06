import { readRuntimeEnv } from "../../config/env";
import type { AppBindings } from "../../types";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const HARD_CODED_ADMIN_EMAIL_WHITELIST: Readonly<Record<"dev" | "prod", readonly string[]>> = {
	dev: ["lguangcong@163.com"],
	prod: ["lguangcong@163.com"],
};

export const getAdminEmailWhitelist = (env: AppBindings) => {
	const runtime = readRuntimeEnv(env);
	return new Set(
		HARD_CODED_ADMIN_EMAIL_WHITELIST[runtime.appEnv].map((email) =>
			normalizeEmail(email),
		),
	);
};

export const isWhitelistedAdminEmail = (
	email: string,
	whitelist: Set<string>,
) => whitelist.has(normalizeEmail(email));
