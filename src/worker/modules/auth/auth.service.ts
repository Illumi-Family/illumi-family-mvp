import type { RollbackIdentityBody } from "./auth.schema";
import { IdentitySyncService } from "../../shared/auth/identity-sync.service";
import type { AppDatabase } from "../../shared/db/client";

export class AuthService {
	constructor(private readonly identitySync: IdentitySyncService) {}

	rollbackIdentity(input: RollbackIdentityBody & { authUserId: string }) {
		return this.identitySync.rollbackLinkedIdentity({
			authUserId: input.authUserId,
			provider: input.provider,
			providerUserId: input.providerUserId,
		});
	}
}

export const buildAuthService = (db: AppDatabase) =>
	new AuthService(new IdentitySyncService(db));
