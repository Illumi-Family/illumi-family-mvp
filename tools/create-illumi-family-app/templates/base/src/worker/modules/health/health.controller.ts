import { factory } from "../../shared/http/factory";
import { jsonSuccess } from "../../shared/http/response";
import { buildHealthPayload } from "./health.service";

export const getHealthHandlers = factory.createHandlers(async (c) => {
	const payload = buildHealthPayload(c.env);
	return jsonSuccess(c, payload);
});
