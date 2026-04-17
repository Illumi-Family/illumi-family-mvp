export type VideoPlayerStartupPhase = "loading" | "playing" | "error";
export type VideoPlayerStartupEvent =
	| "open"
	| "loadstart"
	| "loadeddata"
	| "playing"
	| "error"
	| "retry";

export const reduceVideoPlayerStartupPhase = (
	phase: VideoPlayerStartupPhase,
	event: VideoPlayerStartupEvent,
): VideoPlayerStartupPhase => {
	if (event === "open" || event === "loadstart" || event === "retry") {
		return "loading";
	}
	if (event === "loadeddata" || event === "playing") {
		return "playing";
	}
	if (event === "error") {
		return "error";
	}
	return phase;
};

export const getVideoPlayerOverlayMode = (phase: VideoPlayerStartupPhase) => {
	if (phase === "error") return "error";
	if (phase === "playing") return "hidden";
	return "loading";
};
