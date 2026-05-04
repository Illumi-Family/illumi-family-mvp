export type AppBindings = Env & {
	ASSETS: {
		fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
	};
	APP_ENV: string;
	API_VERSION: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_BASE_URL: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	RESEND_API_KEY?: string;
	RESEND_FROM_EMAIL?: string;
	RESEND_REPLY_TO?: string;
	STREAM_ACCOUNT_ID?: string;
	STREAM_API_TOKEN?: string;
	STREAM_WEBHOOK_SECRET?: string;
	DB: D1Database;
	CACHE: KVNamespace;
	FILES: R2Bucket;
};

export type ContextVariables = {
	requestId: string;
	authUserId?: string;
	videoId?: string;
	homeSectionEntryKey?:
		| "home.hero_slogan"
		| "home.main_video"
		| "home.character_videos"
		| "home.family_story_videos"
		| "home.philosophy"
		| "home.daily_notes"
		| "home.stories"
		| "home.colearning";
};

export type AppContext = {
	Bindings: AppBindings;
	Variables: ContextVariables;
};
