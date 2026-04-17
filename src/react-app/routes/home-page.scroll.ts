type HomeEntryScrollResetDeps = {
	hash: string;
	requestAnimationFrame: (callback: FrameRequestCallback) => number;
	scrollTo: (options: ScrollToOptions) => void;
};

export const scheduleHomeEntryScrollReset = ({
	hash,
	requestAnimationFrame,
	scrollTo,
}: HomeEntryScrollResetDeps): number | null => {
	if (hash.trim().length > 0) return null;
	return requestAnimationFrame(() => {
		scrollTo({ top: 0, left: 0, behavior: "auto" });
	});
};
