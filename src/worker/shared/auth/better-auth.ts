import { betterAuth } from "better-auth";
import { AUTH_BASE_PATH } from "./auth.constants";
import { IdentitySyncService } from "./identity-sync.service";
import { hashPassword, verifyPassword } from "./password-hasher";
import { getDb } from "../db/client";
import { sendVerificationEmail } from "../email/auth-mailer";
import type { AppBindings } from "../../types";

const parseHostname = (url: string) => {
	try {
		return new URL(url).hostname;
	} catch {
		return null;
	}
};

const getEnvironmentHosts = (appEnv: string): string[] => {
	if (appEnv === "prod") {
		return [
			"illumi-family.com",
			"admin.illumi-family.com",
			"illumi-family-mvp.lguangcong0712.workers.dev",
		];
	}

	return [
		"dev.illumi-family.com",
		"admin-dev.illumi-family.com",
		"illumi-family-mvp-dev.lguangcong0712.workers.dev",
		"localhost",
		"127.0.0.1",
	];
};

const toHttpsOrigins = (hosts: string[]) =>
	hosts
		.filter((host) => host !== "localhost" && host !== "127.0.0.1")
		.map((host) => `https://${host}`);

export const buildAllowedAuthHosts = (env: AppBindings) => {
	const hosts = new Set<string>(getEnvironmentHosts(env.APP_ENV));

	const baseUrlHost = parseHostname(env.BETTER_AUTH_BASE_URL);
	if (baseUrlHost) hosts.add(baseUrlHost);

	return Array.from(hosts);
};

export const buildTrustedOrigins = (
	env: AppBindings,
	request?: Request,
): string[] => {
	const origin = request?.headers.get("origin");
	const trustedOriginCandidates = [
		env.BETTER_AUTH_BASE_URL,
		...toHttpsOrigins(getEnvironmentHosts(env.APP_ENV)),
	];
	if (env.APP_ENV !== "prod") {
		trustedOriginCandidates.push(
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		);
	}

	return [
		...trustedOriginCandidates,
		origin,
	].filter((value): value is string => Boolean(value));
};

const optionalGoogleProvider = (env: AppBindings) => {
	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		return undefined;
	}

	return {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
	};
};

const buildMissingBetterAuthSecretMessage = (env: AppBindings) => {
	if (env.APP_ENV === "dev") {
		return "Missing BETTER_AUTH_SECRET. For local dev, set BETTER_AUTH_SECRET in .dev.vars.dev (or .dev.vars), then restart `pnpm dev`. See docs/better-auth-secret-runbook.md.";
	}

	return "Missing BETTER_AUTH_SECRET. Configure it with `pnpm exec wrangler secret put BETTER_AUTH_SECRET --env <target>` before serving auth routes.";
};

const buildMissingBetterAuthBaseUrlMessage = (env: AppBindings) => {
	if (env.APP_ENV === "dev") {
		return "Missing BETTER_AUTH_BASE_URL. For local dev, set BETTER_AUTH_BASE_URL=http://localhost:5173 in .dev.vars.dev (or .dev.vars).";
	}

	return "Missing BETTER_AUTH_BASE_URL. Configure this variable in wrangler vars for the target environment.";
};

export const createAuth = (env: AppBindings) => {
	if (!env.BETTER_AUTH_SECRET) {
		throw new Error(buildMissingBetterAuthSecretMessage(env));
	}
	if (!env.BETTER_AUTH_BASE_URL) {
		throw new Error(buildMissingBetterAuthBaseUrlMessage(env));
	}

	const db = getDb(env);
	const identitySync = new IdentitySyncService(db);
	const googleProvider = optionalGoogleProvider(env);
	const allowedAuthHosts = buildAllowedAuthHosts(env);

	return betterAuth({
		appName: "Illumi Family",
		basePath: AUTH_BASE_PATH,
		baseURL: {
			allowedHosts: allowedAuthHosts,
			fallback: env.BETTER_AUTH_BASE_URL,
			protocol: "auto",
		},
		secret: env.BETTER_AUTH_SECRET,
		database: env.DB,
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			minPasswordLength: 8,
			maxPasswordLength: 128,
			password: {
				hash: hashPassword,
				verify: verifyPassword,
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			sendOnSignIn: true,
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, url }) => {
				try {
					await sendVerificationEmail(env, {
						to: user.email,
						name: user.name,
						url,
					});
				} catch (error) {
					await identitySync.recordEmailDispatchFailure({
						email: user.email,
						authUserId: user.id,
						reason: error instanceof Error ? error.message : "unknown_error",
					});
					throw error;
				}
			},
		},
		socialProviders: googleProvider,
		user: {
			modelName: "auth_users",
			fields: {
				createdAt: "created_at",
				updatedAt: "updated_at",
				emailVerified: "email_verified",
			},
		},
		session: {
			modelName: "auth_sessions",
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			freshAge: 60 * 60 * 24,
			fields: {
				userId: "user_id",
				expiresAt: "expires_at",
				ipAddress: "ip_address",
				userAgent: "user_agent",
				createdAt: "created_at",
				updatedAt: "updated_at",
			},
		},
		account: {
			modelName: "auth_accounts",
			accountLinking: {
				enabled: true,
				disableImplicitLinking: false,
				allowDifferentEmails: false,
				trustedProviders: ["google"],
			},
			fields: {
				providerId: "provider_id",
				accountId: "account_id",
				userId: "user_id",
				accessToken: "access_token",
				refreshToken: "refresh_token",
				idToken: "id_token",
				accessTokenExpiresAt: "access_token_expires_at",
				refreshTokenExpiresAt: "refresh_token_expires_at",
				createdAt: "created_at",
				updatedAt: "updated_at",
			},
		},
		verification: {
			modelName: "auth_verifications",
			fields: {
				expiresAt: "expires_at",
				createdAt: "created_at",
				updatedAt: "updated_at",
			},
		},
		trustedOrigins: (request) => buildTrustedOrigins(env, request),
		advanced: {
			useSecureCookies: env.APP_ENV === "prod",
		},
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						await identitySync.onAuthUserCreated({
							id: String(user.id),
							name: String(user.name ?? ""),
							email: String(user.email ?? ""),
							emailVerified: Boolean(user.emailVerified),
						});
					},
				},
				update: {
					after: async (user) => {
						await identitySync.onAuthUserUpdated({
							id: String(user.id),
							name: String(user.name ?? ""),
							email: String(user.email ?? ""),
							emailVerified: Boolean(user.emailVerified),
						});
					},
				},
			},
			account: {
				create: {
					before: async (account) => {
						await identitySync.beforeAccountCreate({
							id: String(account.id),
							userId: String(account.userId),
							providerId: String(account.providerId),
							accountId: String(account.accountId),
						});
					},
					after: async (account) => {
						await identitySync.afterAccountCreate({
							id: String(account.id),
							userId: String(account.userId),
							providerId: String(account.providerId),
							accountId: String(account.accountId),
						});
					},
				},
			},
			session: {
				create: {
					after: async (session) => {
						await identitySync.onSessionCreated({
							userId: String(session.userId),
						});
					},
				},
			},
		},
	});
};
