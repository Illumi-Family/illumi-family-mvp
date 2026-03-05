import { createFactory } from "hono/factory";
import type { AppContext } from "../../types";

export const factory = createFactory<AppContext>();
