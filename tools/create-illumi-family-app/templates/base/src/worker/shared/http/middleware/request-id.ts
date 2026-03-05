import { factory } from "../factory";

export const requestIdMiddleware = factory.createMiddleware(async (c, next) => {
	const incomingId = c.req.header("x-request-id")?.trim();
	const requestId = incomingId || c.req.header("cf-ray") || crypto.randomUUID();

	c.set("requestId", requestId);
	await next();
	c.header("x-request-id", requestId);
});
