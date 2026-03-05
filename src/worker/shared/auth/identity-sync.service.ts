import { and, eq, sql } from "drizzle-orm";
import { APIError } from "better-auth/api";
import type { AppDatabase } from "../db/client";
import {
	appUsers,
	authAccounts,
	authUsers,
	userIdentities,
	userSecurityEvents,
} from "../db/schema";
import {
	APP_IDENTITY_PROVIDER,
	CREDENTIAL_PROVIDER_ID,
	normalizeEmail,
	toAppProvider,
} from "./auth.constants";

type SecurityEventInput = {
	eventType: string;
	appUserId?: string | null;
	authUserId?: string | null;
	provider?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
	metadata?: unknown;
};

type AuthUserInput = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
};

type AccountInput = {
	id: string;
	userId: string;
	providerId: string;
	accountId: string;
};

export class IdentitySyncService {
	constructor(private readonly db: AppDatabase) {}

	private async recordSecurityEvent(input: SecurityEventInput) {
		const now = new Date();
		await this.db.insert(userSecurityEvents).values({
			id: crypto.randomUUID(),
			appUserId: input.appUserId ?? null,
			authUserId: input.authUserId ?? null,
			eventType: input.eventType,
			provider: input.provider ?? null,
			ipAddress: input.ipAddress ?? null,
			userAgent: input.userAgent ?? null,
			metadata: input.metadata ? JSON.stringify(input.metadata) : null,
			createdAt: now,
		});
	}

	private async getAuthUser(authUserId: string) {
		const rows = await this.db
			.select()
			.from(authUsers)
			.where(eq(authUsers.id, authUserId))
			.limit(1);
		return rows[0] ?? null;
	}

	private async getOrCreateAppUser(input: AuthUserInput) {
		const found = await this.db
			.select()
			.from(appUsers)
			.where(eq(appUsers.authUserId, input.id))
			.limit(1);

		if (found[0]) return found[0];

		const now = new Date();
		const record = {
			id: crypto.randomUUID(),
			authUserId: input.id,
			status: "active",
			displayName: input.name || input.email,
			createdAt: now,
			updatedAt: now,
		} as const;

		await this.db.insert(appUsers).values(record);
		return record;
	}

	private async hasPrimaryIdentity(appUserId: string) {
		const result = await this.db
			.select({ id: userIdentities.id })
			.from(userIdentities)
			.where(
				and(
					eq(userIdentities.appUserId, appUserId),
					eq(userIdentities.isPrimary, true),
				),
			)
			.limit(1);
		return Boolean(result[0]);
	}

	async onAuthUserCreated(user: AuthUserInput) {
		const appUser = await this.getOrCreateAppUser(user);
		await this.recordSecurityEvent({
			eventType: "sign_up_completed",
			appUserId: appUser.id,
			authUserId: user.id,
			provider: APP_IDENTITY_PROVIDER.EMAIL,
			metadata: { source: "auth_user_create" },
		});
	}

	async onAuthUserUpdated(user: AuthUserInput) {
		const now = new Date();
		await this.db
			.update(appUsers)
			.set({
				displayName: user.name || user.email,
				updatedAt: now,
			})
			.where(eq(appUsers.authUserId, user.id));

		await this.db
			.update(userIdentities)
			.set({
				email: normalizeEmail(user.email),
				emailVerified: user.emailVerified,
				updatedAt: now,
			})
			.where(
				and(
					eq(userIdentities.authUserId, user.id),
					eq(userIdentities.provider, APP_IDENTITY_PROVIDER.EMAIL),
				),
			);
	}

	async beforeAccountCreate(account: AccountInput) {
		if (account.providerId === CREDENTIAL_PROVIDER_ID) return;

		const authUser = await this.getAuthUser(account.userId);
		if (!authUser) return false;

		const appUser = await this.getOrCreateAppUser({
			id: authUser.id,
			name: authUser.name,
			email: authUser.email,
			emailVerified: authUser.emailVerified,
		});

		if (appUser.status !== "active") {
			await this.recordSecurityEvent({
				eventType: "merge_blocked",
				appUserId: appUser.id,
				authUserId: authUser.id,
				provider: toAppProvider(account.providerId),
				metadata: {
					reason: "app_user_inactive",
					accountId: account.accountId,
				},
			});
			throw new APIError("FORBIDDEN", {
				message: "Account is not active",
			});
		}

		if (!authUser.emailVerified) {
			await this.recordSecurityEvent({
				eventType: "merge_blocked",
				appUserId: appUser.id,
				authUserId: authUser.id,
				provider: toAppProvider(account.providerId),
				metadata: {
					reason: "email_not_verified",
					accountId: account.accountId,
				},
			});
			throw new APIError("UNAUTHORIZED", {
				message: "Email must be verified before account merge",
			});
		}

		await this.recordSecurityEvent({
			eventType: "merge_started",
			appUserId: appUser.id,
			authUserId: authUser.id,
			provider: toAppProvider(account.providerId),
			metadata: { accountId: account.accountId },
		});
	}

	async afterAccountCreate(account: AccountInput) {
		const authUser = await this.getAuthUser(account.userId);
		if (!authUser) return;

		const appUser = await this.getOrCreateAppUser({
			id: authUser.id,
			name: authUser.name,
			email: authUser.email,
			emailVerified: authUser.emailVerified,
		});
		const provider = toAppProvider(account.providerId);
		const normalizedEmail = normalizeEmail(authUser.email);
		const now = new Date();
		const hasPrimary = await this.hasPrimaryIdentity(appUser.id);
		const shouldPrimary = provider === APP_IDENTITY_PROVIDER.EMAIL || !hasPrimary;

		if (provider === APP_IDENTITY_PROVIDER.EMAIL) {
			await this.db
				.update(userIdentities)
				.set({ isPrimary: false, updatedAt: now })
				.where(eq(userIdentities.appUserId, appUser.id));
		}

		await this.db
			.insert(userIdentities)
			.values({
				id: crypto.randomUUID(),
				appUserId: appUser.id,
				authUserId: authUser.id,
				provider,
				providerUserId:
					provider === APP_IDENTITY_PROVIDER.EMAIL
						? normalizedEmail
						: account.accountId,
				email: normalizedEmail,
				emailVerified: authUser.emailVerified,
				isPrimary: shouldPrimary,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [userIdentities.provider, userIdentities.providerUserId],
				set: {
					appUserId: appUser.id,
					authUserId: authUser.id,
					email: normalizedEmail,
					emailVerified: authUser.emailVerified,
					isPrimary: shouldPrimary,
					updatedAt: now,
				},
			});

		await this.recordSecurityEvent({
			eventType:
				provider === APP_IDENTITY_PROVIDER.GOOGLE
					? "merge_succeeded"
					: "identity_linked",
			appUserId: appUser.id,
			authUserId: authUser.id,
			provider,
			metadata: {
				accountId: account.accountId,
				authAccountId: account.id,
			},
		});
	}

	async onSessionCreated(input: { userId: string }) {
		const authUser = await this.getAuthUser(input.userId);
		if (!authUser) return;

		const appUser = await this.getOrCreateAppUser({
			id: authUser.id,
			name: authUser.name,
			email: authUser.email,
			emailVerified: authUser.emailVerified,
		});

		await this.recordSecurityEvent({
			eventType: "sign_in_succeeded",
			appUserId: appUser.id,
			authUserId: authUser.id,
		});
	}

	async recordEmailDispatchFailure(input: {
		email: string;
		authUserId?: string;
		reason: string;
	}) {
		const authUser = input.authUserId
			? await this.getAuthUser(input.authUserId)
			: null;
		const appUser = authUser
			? await this.getOrCreateAppUser({
					id: authUser.id,
					name: authUser.name,
					email: authUser.email,
					emailVerified: authUser.emailVerified,
			  })
			: null;

		await this.recordSecurityEvent({
			eventType: "verification_email_failed",
			appUserId: appUser?.id ?? null,
			authUserId: input.authUserId ?? null,
			provider: APP_IDENTITY_PROVIDER.EMAIL,
			metadata: {
				email: normalizeEmail(input.email),
				reason: input.reason,
			},
		});
	}

	async rollbackLinkedIdentity(input: {
		authUserId: string;
		provider: string;
		providerUserId: string;
	}) {
		const normalizedProviderUserId =
			input.provider === APP_IDENTITY_PROVIDER.EMAIL
				? normalizeEmail(input.providerUserId)
				: input.providerUserId;

		const targetIdentity = await this.db
			.select()
			.from(userIdentities)
			.where(
				and(
					eq(userIdentities.provider, input.provider),
					eq(userIdentities.providerUserId, normalizedProviderUserId),
					eq(userIdentities.authUserId, input.authUserId),
				),
			)
			.limit(1);

		const identity = targetIdentity[0];
		if (!identity) {
			return { changed: false };
		}

		if (identity.provider === APP_IDENTITY_PROVIDER.EMAIL) {
			throw new APIError("BAD_REQUEST", {
				message: "Primary email identity cannot be rolled back",
			});
		}

		await this.db
			.delete(userIdentities)
			.where(eq(userIdentities.id, identity.id));

		await this.db
			.delete(authAccounts)
			.where(
				and(
					eq(authAccounts.userId, input.authUserId),
					eq(authAccounts.providerId, input.provider),
					eq(authAccounts.accountId, normalizedProviderUserId),
				),
			);

		await this.recordSecurityEvent({
			eventType: "merge_rolled_back",
			appUserId: identity.appUserId,
			authUserId: input.authUserId,
			provider: input.provider,
			metadata: { providerUserId: normalizedProviderUserId },
		});

		return { changed: true };
	}

	async purgeExpiredSecurityEvents(retentionDays: number) {
		const deleted = await this.db
			.delete(userSecurityEvents)
			.where(
				sql`${userSecurityEvents.createdAt} < ${new Date(
					Date.now() - retentionDays * 24 * 60 * 60 * 1000,
				)}`,
			)
			.returning({ id: userSecurityEvents.id });
		return deleted.length;
	}
}
