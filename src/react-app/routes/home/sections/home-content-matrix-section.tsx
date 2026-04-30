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
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{content.items.map((item) => (
					<article
						key={item.platform}
						className="space-y-3 rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.82)] px-3 py-4"
					>
						<div className="aspect-square overflow-hidden rounded-xl border border-[color:rgba(166,124,82,0.2)] bg-white">
							<img
								src={item.qrImageSrc}
								alt={item.qrImageAlt}
								className="h-full w-full object-cover"
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
