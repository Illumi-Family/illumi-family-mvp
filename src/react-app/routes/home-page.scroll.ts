type HomeEntryScrollResetDeps = {
	requestAnimationFrame: (callback: FrameRequestCallback) => number;
	scrollTo: (options: ScrollToOptions) => void;
};

type MobileNavSelectionDeps = {
	closeDrawer: () => void;
	onScrollToSection: (sectionId: string) => void;
	requestAnimationFrame?: (callback: FrameRequestCallback) => number;
};

export const scheduleHomeEntryScrollReset = ({
	requestAnimationFrame,
	scrollTo,
}: HomeEntryScrollResetDeps): number | null => {
	return requestAnimationFrame(() => {
		scrollTo({ top: 0, left: 0, behavior: "auto" });
	});
};

export const handleMobileNavSelection = (
	sectionId: string,
	{ closeDrawer, onScrollToSection, requestAnimationFrame }: MobileNavSelectionDeps,
) => {
	closeDrawer();
	const schedule = requestAnimationFrame ?? ((callback: FrameRequestCallback) => callback(0));
	schedule(() => {
		onScrollToSection(sectionId);
	});
};
