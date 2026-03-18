import type { CtaLink, ColearningMethodItem } from "@/routes/home-page.data";
import { useTranslation } from "react-i18next";
import { MarkdownRenderer } from "@/components/common/markdown-renderer";
import { PaperCard } from "@/routes/home/components/paper-card";
import { SectionHeading } from "@/routes/home/components/section-heading";

interface ColearningSectionProps {
	intro: string;
	methods: ColearningMethodItem[];
	benefits: string[];
	caseHighlight: {
		title: string;
		summary: string;
		cta: CtaLink;
	};
}

export function ColearningSection({
	intro,
	methods,
	benefits,
	caseHighlight,
}: ColearningSectionProps) {
	const { t } = useTranslation("home");

	return (
		<section id="colearning" className="space-y-8 py-2">
			<SectionHeading
				label={t("colearning.label")}
				title={t("colearning.title")}
				description={intro}
			/>
			<div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
				<PaperCard motionDelayMs={100} className="space-y-4">
					<h3 className="font-brand text-2xl text-foreground">{t("colearning.methodsTitle")}</h3>
					<div className="space-y-3">
						{methods.map((item) => (
							<div
								key={item.title}
								className="rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.75)] px-4 py-3"
							>
								<p className="font-medium text-foreground">{item.title}</p>
								<MarkdownRenderer
									content={item.description}
									className="mt-1 text-sm leading-relaxed text-muted-foreground"
								/>
							</div>
						))}
					</div>
				</PaperCard>
				<PaperCard tone="soft" motionDelayMs={180} className="space-y-4">
					<h3 className="font-brand text-2xl text-foreground">{t("colearning.benefitsTitle")}</h3>
					<ul className="space-y-2 text-sm leading-relaxed text-muted-foreground md:text-base">
						{benefits.map((item) => (
							<li key={item} className="flex items-start gap-2">
								<span
									aria-hidden="true"
									className="mt-[0.55rem] size-1.5 rounded-full bg-[color:var(--brand-primary)]"
								/>
								<span>{item}</span>
							</li>
						))}
					</ul>
					<div className="rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-card p-4">
						<p className="font-medium text-foreground">{caseHighlight.title}</p>
						<MarkdownRenderer
							content={caseHighlight.summary}
							className="mt-2 text-sm leading-relaxed text-muted-foreground"
						/>
						<a
							href={caseHighlight.cta.href}
							className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-[color:rgba(166,124,82,0.92)]"
						>
							{caseHighlight.cta.label}
						</a>
					</div>
				</PaperCard>
			</div>
		</section>
	);
}
