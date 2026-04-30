type HomeEntryScrollResetDeps = {
	requestAnimationFrame: (callback: FrameRequestCallback) => number;
	scrollTo: (options: ScrollToOptions) => void;
};

export const scheduleHomeEntryScrollReset = ({
	requestAnimationFrame,
	scrollTo,
}: HomeEntryScrollResetDeps): number | null => {
	return requestAnimationFrame(() => {
		scrollTo({ top: 0, left: 0, behavior: "auto" });
	});
};
