export type VideoPlaybackStartupKind = "cold" | "warm";
export type VideoPlaybackMetricEventType =
	| "click"
	| "loadeddata"
	| "playing"
	| "error";

export type VideoPlaybackMetricEvent = {
	sessionId: string;
	streamVideoId: string | null;
	startupKind: VideoPlaybackStartupKind;
	event: VideoPlaybackMetricEventType;
	at: number;
	elapsedMs: number;
};

type PlaybackMetricSession = {
	sessionId: string;
	streamVideoId: string | null;
	startupKind: VideoPlaybackStartupKind;
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
	now?: number;
}) => {
	const now = input.now ?? Date.now();
	const sessionId = createSessionId();
	const session: PlaybackMetricSession = {
		sessionId,
		streamVideoId: input.streamVideoId,
		startupKind: input.startupKind,
		startAt: now,
	};
	metricsState.sessions.set(sessionId, session);
	appendMetricEvent(session, "click", now);
	return sessionId;
};

export const markVideoPlaybackMetric = (
	sessionId: string | null,
	event: Exclude<VideoPlaybackMetricEventType, "click">,
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
