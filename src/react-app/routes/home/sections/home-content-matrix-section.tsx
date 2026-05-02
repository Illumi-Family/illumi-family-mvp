import type { HomeContentMatrixContent } from "@/routes/home-page.data";
import { SectionHeading } from "@/routes/home/components/section-heading";

type HomeContentMatrixSectionProps = {
	content: HomeContentMatrixContent;
};

export function HomeContentMatrixSection({ content }: HomeContentMatrixSectionProps) {
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
						<div className="mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-lg border border-[color:rgba(166,124,82,0.1)] bg-white p-0.5 md:max-w-[236px] md:p-1 lg:max-w-[260px] xl:max-w-[280px]">
							<img
								src={item.qrImageSrc}
								alt={item.qrImageAlt}
								className="h-full w-full object-contain"
								loading="lazy"
							/>
						</div>
						<p className="text-center text-sm font-medium text-foreground">{item.platform}</p>
					</article>
				))}
			</div>
		</section>
	);
}
