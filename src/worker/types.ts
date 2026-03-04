export type AppBindings = Env & {
	APP_ENV: string;
	API_VERSION: string;
	DB: D1Database;
	CACHE: KVNamespace;
	FILES: R2Bucket;
};

export type ContextVariables = {
	requestId: string;
};

export type AppContext = {
	Bindings: AppBindings;
	Variables: ContextVariables;
};
