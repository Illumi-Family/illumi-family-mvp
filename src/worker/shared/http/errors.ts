import type { StatusCode } from "hono/utils/http-status";

export class AppError extends Error {
	readonly code: string;
	readonly status: StatusCode;
	readonly details?: unknown;

	constructor(
		code: string,
		message: string,
		status: StatusCode,
		details?: unknown,
	) {
		super(message);
		this.name = "AppError";
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

export const isAppError = (error: unknown): error is AppError =>
	error instanceof AppError;
