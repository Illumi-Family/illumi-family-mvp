import type { DailyNoteItem } from "@/routes/home-page.data";
import { Badge } from "@/components/ui/badge";
import { PaperCard } from "@/routes/home/components/paper-card";
import { SectionHeading } from "@/routes/home/components/section-heading";

interface DailyNotesSectionProps {
	items: DailyNoteItem[];
}

export function DailyNotesSection({ items }: DailyNotesSectionProps) {
	return (
		<section id="daily" className="space-y-8 py-2">
			<SectionHeading
				label="践行感悟·日思"
				title="把日子过成教育，把感悟变成力量"
				description="记录生活里的点滴觉醒，书写教养中的真实体悟。在日常里观心，在陪伴中成长，在践行中传承。"
			/>
			<div className="grid gap-4 lg:grid-cols-2">
				{items.map((item, index) => (
					<PaperCard key={`${item.date}-${item.title}`} motionDelayMs={90 + index * 70}>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<time
								dateTime={item.date}
								className="text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--brand-primary)]"
							>
								{item.date}
							</time>
							<div className="flex flex-wrap gap-2">
								{item.tags.map((tag) => (
									<Badge
										key={tag}
										variant="outline"
										className="rounded-full border-[color:rgba(166,124,82,0.3)] bg-[color:rgba(255,252,247,0.82)] text-muted-foreground"
									>
										{tag}
									</Badge>
								))}
							</div>
						</div>
						<h3 className="mt-4 font-brand text-2xl text-foreground">{item.title}</h3>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
							{item.summary}
						</p>
					</PaperCard>
				))}
			</div>
			<div>
				<a
					href="#contact"
					className="inline-flex h-10 items-center justify-center rounded-full border border-input bg-background px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-[color:rgba(243,236,227,0.65)]"
				>
					查看更多日思
				</a>
			</div>
		</section>
	);
}
