import type { Context } from "hono";
import type { AppContext } from "../../../types";
import { AppError, isAppError } from "../errors";
import { jsonFailure } from "../response";

export const handleAppError = (error: unknown, c: Context<AppContext>) => {
	if (isAppError(error)) {
		return jsonFailure(
			c,
			{ code: error.code, message: error.message, details: error.details },
			error.status,
		);
	}

	console.error("Unhandled error", error);
	return jsonFailure(
		c,
		{ code: "INTERNAL_SERVER_ERROR", message: "Unexpected server error" },
		500,
	);
};

export const badRequestError = (message: string, details?: unknown) =>
	new AppError("BAD_REQUEST", message, 400, details);
