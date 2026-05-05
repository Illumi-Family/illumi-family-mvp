import { useEffect, useState } from "react";
import type { HomeContentMatrixContent } from "@/routes/home-page.data";
import { SectionHeading } from "@/routes/home/components/section-heading";

type HomeContentMatrixSectionProps = {
	content: HomeContentMatrixContent;
};

const MOBILE_QR_PREVIEW_MAX_WIDTH = 767;

const isMobileQrPreviewViewport = (viewportWidth: number) =>
	viewportWidth <= MOBILE_QR_PREVIEW_MAX_WIDTH;

export function HomeContentMatrixSection({ content }: HomeContentMatrixSectionProps) {
	const [isMobilePreviewEnabled, setIsMobilePreviewEnabled] = useState(false);
	const [activePreviewPlatform, setActivePreviewPlatform] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_QR_PREVIEW_MAX_WIDTH}px)`);
		const syncViewport = () => {
			setIsMobilePreviewEnabled(isMobileQrPreviewViewport(window.innerWidth));
		};
		syncViewport();
		mediaQuery.addEventListener("change", syncViewport);
		return () => {
			mediaQuery.removeEventListener("change", syncViewport);
		};
	}, []);

	useEffect(() => {
		if (isMobilePreviewEnabled) return;
		setActivePreviewPlatform(null);
	}, [isMobilePreviewEnabled]);

	useEffect(() => {
		if (!activePreviewPlatform) return;
		if (typeof document === "undefined") return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [activePreviewPlatform]);

	useEffect(() => {
		if (!activePreviewPlatform) return;
		if (typeof window === "undefined") return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			setActivePreviewPlatform(null);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [activePreviewPlatform]);

	const activePreviewItem =
		content.items.find((item) => item.platform === activePreviewPlatform) ?? null;

	const openPreview = (platform: string) => {
		if (!isMobilePreviewEnabled) return;
		setActivePreviewPlatform(platform);
	};

	const closePreview = () => {
		setActivePreviewPlatform(null);
	};

	return (
		<section id={content.sectionId} className="space-y-8 py-2">
			<SectionHeading
				label={content.label}
				title={content.title}
				description={content.description}
			/>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-5 lg:gap-6">
				{content.items.map((item) => (
					<article
						key={item.platform}
						className="space-y-3 rounded-2xl border border-[color:rgba(166,124,82,0.12)] bg-[color:rgba(255,252,247,0.82)] px-3 py-4 md:px-2 md:py-4 lg:px-3 lg:py-5"
					>
						<button
							type="button"
							className="mx-auto block aspect-square w-full max-w-[220px] overflow-hidden rounded-lg border border-[color:rgba(166,124,82,0.1)] bg-white p-0.5 text-left md:max-w-[236px] md:cursor-default md:p-1 lg:max-w-[260px] xl:max-w-[280px]"
							onClick={() => openPreview(item.platform)}
							aria-label={`${item.platform}二维码预览`}
							aria-haspopup={isMobilePreviewEnabled ? "dialog" : undefined}
							aria-expanded={
								activePreviewItem?.platform === item.platform ? "true" : "false"
							}
							aria-disabled={isMobilePreviewEnabled ? "false" : "true"}
							data-mobile-preview-enabled={isMobilePreviewEnabled ? "true" : "false"}
						>
							<img
								src={item.qrImageSrc}
								alt={item.qrImageAlt}
								className="h-full w-full object-contain"
								loading="lazy"
							/>
						</button>
						<p className="text-center text-sm font-medium text-foreground">{item.platform}</p>
					</article>
				))}
			</div>
			{activePreviewItem ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center px-4 md:hidden">
					<button
						type="button"
						aria-label="关闭二维码预览"
						className="absolute inset-0 bg-black/55"
						onClick={closePreview}
					/>
					<div
						role="dialog"
						aria-modal="true"
						aria-label={`${activePreviewItem.platform}二维码大图预览`}
						className="relative z-10 w-full max-w-sm rounded-2xl border border-[color:rgba(166,124,82,0.22)] bg-[color:rgba(255,252,247,0.98)] p-4 shadow-2xl"
					>
						<div className="mb-3 flex items-center justify-between">
							<p className="text-sm font-semibold text-foreground">
								{activePreviewItem.platform}
							</p>
							<button
								type="button"
								onClick={closePreview}
								className="rounded-full border border-[color:rgba(166,124,82,0.28)] px-3 py-1 text-xs text-muted-foreground"
							>
								关闭
							</button>
						</div>
						<div className="mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-xl border border-[color:rgba(166,124,82,0.12)] bg-white p-1">
							<img
								src={activePreviewItem.qrImageSrc}
								alt={activePreviewItem.qrImageAlt}
								className="h-full w-full object-contain"
								loading="eager"
							/>
						</div>
						<p className="mt-3 text-center text-xs text-muted-foreground">
							可长按保存或识别二维码
						</p>
					</div>
				</div>
			) : null}
		</section>
	);
}
