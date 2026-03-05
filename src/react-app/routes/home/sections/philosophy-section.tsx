import type { PhilosophyItem } from "@/routes/home-page.data";
import { PaperCard } from "@/routes/home/components/paper-card";
import { SectionHeading } from "@/routes/home/components/section-heading";

interface PhilosophySectionProps {
	intro: string;
	items: PhilosophyItem[];
}

export function PhilosophySection({ intro, items }: PhilosophySectionProps) {
	return (
		<section id="philosophy" className="space-y-8 py-2">
			<SectionHeading
				label="家风家学·理念"
				title="扎根生命的家庭教育，不靠焦虑驱动"
				description={intro}
			/>
			<div className="grid gap-4 md:grid-cols-3">
				{items.map((item, index) => (
					<PaperCard key={item.title} tone="soft" motionDelayMs={100 + index * 70}>
						<h3 className="font-brand text-2xl text-foreground">{item.title}</h3>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
							{item.description}
						</p>
					</PaperCard>
				))}
			</div>
		</section>
	);
}
