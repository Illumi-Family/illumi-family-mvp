import { z } from "zod";

export const rollbackIdentityBodySchema = z.object({
	provider: z.string().min(1).max(64),
	providerUserId: z.string().min(1).max(255),
});

export type RollbackIdentityBody = z.infer<typeof rollbackIdentityBodySchema>;
