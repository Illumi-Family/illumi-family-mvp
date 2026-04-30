export type VideoPlaybackStartupKind = "cold" | "warm";
export type VideoPlaybackSurface = "video-modal" | "home-main";
export type VideoPlaybackMetricEventType =
	| "play_intent"
	| "click"
	| "loadstart"
	| "loadeddata"
	| "playing"
	| "error";

export type VideoPlaybackMetricEvent = {
	sessionId: string;
	streamVideoId: string | null;
	startupKind: VideoPlaybackStartupKind;
	surface: VideoPlaybackSurface;
	event: VideoPlaybackMetricEventType;
	at: number;
	elapsedMs: number;
};

type PlaybackMetricSession = {
	sessionId: string;
	streamVideoId: string | null;
	startupKind: VideoPlaybackStartupKind;
	surface: VideoPlaybackSurface;
	startAt: number;
};

const metricsState = {
	nextSessionNo: 1,
	sessions: new Map<string, PlaybackMetricSession>(),
	events: [] as VideoPlaybackMetricEvent[],
};

const TERMINAL_EVENTS = new Set<VideoPlaybackMetricEventType>(["playing", "error"]);

const createSessionId = () => {
	const sessionId = `video-playback-${metricsState.nextSessionNo}`;
	metricsState.nextSessionNo += 1;
	return sessionId;
};

const appendMetricEvent = (
	session: PlaybackMetricSession,
	event: VideoPlaybackMetricEventType,
	now: number,
) => {
	const elapsedMs = Math.max(0, Math.round(now - session.startAt));
	const payload: VideoPlaybackMetricEvent = {
		sessionId: session.sessionId,
		streamVideoId: session.streamVideoId,
		startupKind: session.startupKind,
		surface: session.surface,
		event,
		at: now,
		elapsedMs,
	};
	metricsState.events.push(payload);
	return payload;
};

export const beginVideoPlaybackMetricSession = (input: {
	streamVideoId: string | null;
	startupKind: VideoPlaybackStartupKind;
	surface?: VideoPlaybackSurface;
	intentEvent?: "click" | "play_intent";
	now?: number;
}) => {
	const now = input.now ?? Date.now();
	const sessionId = createSessionId();
	const intentEvent = input.intentEvent ?? "click";
	const session: PlaybackMetricSession = {
		sessionId,
		streamVideoId: input.streamVideoId,
		startupKind: input.startupKind,
		surface: input.surface ?? "video-modal",
		startAt: now,
	};
	metricsState.sessions.set(sessionId, session);
	appendMetricEvent(session, intentEvent, now);
	return sessionId;
};

export const markVideoPlaybackMetric = (
	sessionId: string | null,
	event: Exclude<VideoPlaybackMetricEventType, "click" | "play_intent">,
	now?: number,
) => {
	if (!sessionId) return null;
	const session = metricsState.sessions.get(sessionId);
	if (!session) return null;

	const payload = appendMetricEvent(session, event, now ?? Date.now());
	if (TERMINAL_EVENTS.has(event)) {
		metricsState.sessions.delete(sessionId);
	}
	return payload;
};

export const getVideoPlaybackMetricEvents = () => [...metricsState.events];

export const clearVideoPlaybackMetricsForTest = () => {
	metricsState.nextSessionNo = 1;
	metricsState.sessions.clear();
	metricsState.events = [];
};
