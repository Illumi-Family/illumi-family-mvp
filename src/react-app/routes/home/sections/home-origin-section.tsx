import type { HomeOriginContent } from "@/routes/home-page.data";
import { SectionHeading } from "@/routes/home/components/section-heading";

type HomeOriginSectionProps = {
	content: HomeOriginContent;
};

const renderParagraphs = (items: string[]) =>
	items.map((item, index) => (
		<p key={`${index}-${item.slice(0, 16)}`} className="text-sm leading-8 text-foreground/90 md:text-base">
			{item}
		</p>
	));

export function HomeOriginSection({ content }: HomeOriginSectionProps) {
	return (
		<section id={content.sectionId} className="space-y-8 py-2">
			<SectionHeading
				label={content.label}
				title={content.title}
				description={content.ipIntro[0] ?? ""}
			/>
			<div className="space-y-5 rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.82)] px-5 py-6 md:px-8 md:py-7">
				<h3 className="font-brand text-2xl text-foreground">{content.ipIntroHeading}</h3>
				<div className="space-y-4">{renderParagraphs(content.ipIntro)}</div>
			</div>
			<div className="space-y-5 rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.82)] px-5 py-6 md:px-8 md:py-7">
				<h3 className="font-brand text-2xl text-foreground">
					{content.brandVisionHeading}
				</h3>
				<div className="space-y-4">{renderParagraphs(content.brandVision)}</div>
			</div>
		</section>
	);
}
