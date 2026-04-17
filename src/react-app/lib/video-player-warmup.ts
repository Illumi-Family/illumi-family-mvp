type NetworkConnection = {
	saveData?: boolean;
	effectiveType?: string;
};

type NavigatorWithConnection = Navigator & {
	connection?: NetworkConnection;
};

type IdleCallback = (callback: () => void, options?: { timeout?: number }) => number;

const STREAM_SDK_URL = "https://embed.videodelivery.net/embed/sdk.latest.js";
const STREAM_IFRAME_URL_PREFIX = "https://iframe.videodelivery.net/";

const warmupState = {
	sdkWarmupScheduled: false,
	sdkWarmupReady: false,
	warmedVideoIds: new Set<string>(),
	insertedHints: new Set<string>(),
};

const getDocument = () => {
	if (typeof document === "undefined") return null;
	return document;
};

const getNavigatorConnection = (): NetworkConnection | null => {
	if (typeof navigator === "undefined") return null;
	const withConnection = navigator as NavigatorWithConnection;
	return withConnection.connection ?? null;
};

const isNetworkConstrained = () => {
	const connection = getNavigatorConnection();
	if (!connection) return false;
	if (connection.saveData) return true;
	return connection.effectiveType === "slow-2g" || connection.effectiveType === "2g";
};

const addLinkHint = (
	rel: "preload" | "prefetch",
	href: string,
	as?: "script" | "document",
) => {
	const doc = getDocument();
	if (!doc || !doc.head || typeof doc.createElement !== "function") {
		return false;
	}

	const cacheKey = `${rel}|${href}|${as ?? ""}`;
	if (warmupState.insertedHints.has(cacheKey)) {
		return false;
	}

	try {
		const link = doc.createElement("link");
		link.rel = rel;
		link.href = href;
		if (as) {
			link.as = as;
		}
		doc.head.appendChild(link);
		warmupState.insertedHints.add(cacheKey);
		return true;
	} catch {
		return false;
	}
};

const runSdkWarmup = () => {
	const applied = addLinkHint("preload", STREAM_SDK_URL, "script");
	warmupState.sdkWarmupScheduled = false;
	if (applied) {
		warmupState.sdkWarmupReady = true;
	}
};

const scheduleIdle = (callback: () => void) => {
	const idle = (globalThis as { requestIdleCallback?: IdleCallback })
		.requestIdleCallback;
	if (typeof idle === "function") {
		idle(callback, { timeout: 1200 });
		return;
	}
	globalThis.setTimeout(callback, 120);
};

export const scheduleVideoPlayerSdkWarmup = () => {
	if (!getDocument()) return false;
	if (warmupState.sdkWarmupReady || warmupState.sdkWarmupScheduled) return false;

	warmupState.sdkWarmupScheduled = true;
	scheduleIdle(runSdkWarmup);
	return true;
};

export const warmupVideoPlaybackIntent = (streamVideoId: string | null | undefined) => {
	if (!getDocument()) return false;
	const videoId = streamVideoId?.trim();
	if (!videoId) return false;
	if (isNetworkConstrained()) return false;
	if (warmupState.warmedVideoIds.has(videoId)) return false;

	warmupState.warmedVideoIds.add(videoId);
	scheduleVideoPlayerSdkWarmup();
	void addLinkHint(
		"prefetch",
		`${STREAM_IFRAME_URL_PREFIX}${encodeURIComponent(videoId)}`,
		"document",
	);
	return true;
};

export const hasVideoPlaybackWarmupHit = (
	streamVideoId: string | null | undefined,
) => {
	const videoId = streamVideoId?.trim();
	if (!videoId) return false;
	return warmupState.warmedVideoIds.has(videoId);
};

export const resetVideoPlayerWarmupStateForTest = () => {
	warmupState.sdkWarmupScheduled = false;
	warmupState.sdkWarmupReady = false;
	warmupState.warmedVideoIds.clear();
	warmupState.insertedHints.clear();
};
