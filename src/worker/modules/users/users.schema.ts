import { z } from "zod";

export const updateCurrentUserBodySchema = z.object({
	name: z.string().min(1).max(120),
});

export type UpdateCurrentUserBody = z.infer<typeof updateCurrentUserBodySchema>;
