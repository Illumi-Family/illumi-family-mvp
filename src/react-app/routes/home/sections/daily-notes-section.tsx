import type { DailyNoteItem } from "@/routes/home-page.data";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/common/markdown-renderer";
import { PaperCard } from "@/routes/home/components/paper-card";
import { SectionHeading } from "@/routes/home/components/section-heading";

interface DailyNotesSectionProps {
	items: DailyNoteItem[];
}

export function DailyNotesSection({ items }: DailyNotesSectionProps) {
	const { t } = useTranslation("home");

	return (
		<section id="daily" className="space-y-8 py-2">
			<SectionHeading
				label={t("daily.label")}
				title={t("daily.title")}
				description={t("daily.description")}
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
						<MarkdownRenderer
							content={item.summary}
							className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base"
						/>
					</PaperCard>
				))}
			</div>
			<div>
				<a
					href="#contact"
					className="inline-flex h-10 items-center justify-center rounded-full border border-input bg-background px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-[color:rgba(243,236,227,0.65)]"
				>
					{t("daily.viewMore")}
				</a>
			</div>
		</section>
	);
}
