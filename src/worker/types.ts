export type AppBindings = Env & {
	APP_ENV: string;
	API_VERSION: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_BASE_URL: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	RESEND_API_KEY?: string;
	RESEND_FROM_EMAIL?: string;
	RESEND_REPLY_TO?: string;
	DB: D1Database;
	CACHE: KVNamespace;
	FILES: R2Bucket;
};

export type ContextVariables = {
	requestId: string;
	authUserId?: string;
	homeSectionEntryKey?:
		| "home.philosophy"
		| "home.daily_notes"
		| "home.stories"
		| "home.colearning";
};

export type AppContext = {
	Bindings: AppBindings;
	Variables: ContextVariables;
};
