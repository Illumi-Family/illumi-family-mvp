import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import type { AppContext } from "../../types";

type FailurePayload = {
	code: string;
	message: string;
	details?: unknown;
};

const readRequestId = (c: Context<AppContext>) => c.get("requestId") ?? "unknown";

export const jsonSuccess = <T>(
	c: Context<AppContext>,
	data: T,
	status: StatusCode = 200,
) => {
	c.status(status);
	return c.json(
		{
			success: true,
			data,
			requestId: readRequestId(c),
		},
	);
};

export const jsonFailure = (
	c: Context<AppContext>,
	error: FailurePayload,
	status: StatusCode,
) => {
	c.status(status);
	return c.json(
		{
			success: false,
			error,
			requestId: readRequestId(c),
		},
	);
};
