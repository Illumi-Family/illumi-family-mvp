import type { StoryItem } from "@/routes/home-page.data";
import { useTranslation } from "react-i18next";
import { MarkdownRenderer } from "@/components/common/markdown-renderer";
import { PaperCard } from "@/routes/home/components/paper-card";
import { SectionHeading } from "@/routes/home/components/section-heading";
import { StoryStatusBadge } from "@/routes/home/components/story-status-badge";

interface StoriesSectionProps {
	items: StoryItem[];
}

export function StoriesSection({ items }: StoriesSectionProps) {
	const { t } = useTranslation("home");

	return (
		<section id="stories" className="space-y-8 py-2">
			<SectionHeading
				label={t("stories.label")}
				title={t("stories.title")}
				description={t("stories.description")}
			/>
			<div className="grid gap-4 md:grid-cols-3">
				{items.map((item, index) => {
					const isPublished = item.status === "published";
					const isExternal = typeof item.link === "string" && item.link.startsWith("http");

					return (
						<PaperCard key={item.title} motionDelayMs={90 + index * 70}>
							<div className="flex items-center justify-between gap-2">
								<p className="text-xs uppercase tracking-[0.12em] text-[color:var(--brand-primary)]">
									{item.publishDate}
								</p>
								<StoryStatusBadge status={item.status} />
							</div>
							<h3 className="mt-4 font-brand text-2xl leading-snug text-foreground">{item.title}</h3>
							<MarkdownRenderer
								content={item.summary}
								className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base"
							/>
							<div className="mt-4 flex items-center justify-between gap-3 border-t border-[color:rgba(166,124,82,0.18)] pt-4 text-xs text-muted-foreground">
								<span>
									{t("stories.durationPrefix")}
									{item.duration}
								</span>
								{isPublished && item.link ? (
									<a
										href={item.link}
										target={isExternal ? "_blank" : undefined}
										rel={isExternal ? "noreferrer" : undefined}
										className="inline-flex h-8 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors duration-200 hover:bg-[color:rgba(166,124,82,0.92)]"
									>
										{t("stories.watch")}
									</a>
								) : (
									<button
										type="button"
										disabled
										className="inline-flex h-8 items-center justify-center rounded-full border border-input px-4 text-xs font-medium text-muted-foreground"
									>
										{t("stories.comingSoon")}
									</button>
								)}
							</div>
						</PaperCard>
					);
				})}
			</div>
		</section>
	);
}
