import { z } from "zod";

export const createUserBodySchema = z.object({
	email: z.string().email(),
	name: z.string().min(1).max(120),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
