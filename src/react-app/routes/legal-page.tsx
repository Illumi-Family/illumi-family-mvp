import { Link } from "@tanstack/react-router";
import { useAppI18n } from "@/i18n/context";
import type { LegalPageKey } from "@/routes/legal-pages.data";
import { getLegalPageContent } from "@/routes/legal-pages.data";

interface LegalPageProps {
	pageKey: LegalPageKey;
}

export function LegalPage({ pageKey }: LegalPageProps) {
	const { locale } = useAppI18n();
	const content = getLegalPageContent(locale, pageKey);

	return (
		<div className="px-4 py-8 md:px-6 md:py-10">
			<div className="mx-auto w-full max-w-4xl space-y-6">
				<header className="rounded-2xl border border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.84)] p-5 md:p-6">
					<div className="space-y-3">
						<p className="inline-flex rounded-full border border-[color:rgba(166,124,82,0.32)] px-3 py-1 text-xs text-muted-foreground">
							{content.version}
						</p>
						<h1 className="font-brand text-3xl leading-tight text-foreground md:text-4xl">
							{content.title}
						</h1>
						<p className="text-sm leading-7 text-muted-foreground md:text-base">
							{content.summary}
						</p>
						<p className="text-xs leading-6 text-muted-foreground">
							<span>{content.reviewNotice}</span>
							{" · "}
							<span>Effective: {content.effectiveDate}</span>
							{" · "}
							<span>Updated: {content.lastUpdated}</span>
						</p>
					</div>
				</header>

				<section className="space-y-3 rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.68)] p-5 md:p-6">
					{content.sections.map((section) => (
						<article key={section.heading} className="space-y-1.5">
							<h2 className="text-base font-semibold text-foreground md:text-lg">
								{section.heading}
							</h2>
							<p className="text-sm leading-7 text-muted-foreground md:text-base">
								{section.body}
							</p>
						</article>
					))}
				</section>

				<footer className="flex flex-col gap-3 rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.68)] p-5 md:flex-row md:items-center md:justify-between md:p-6">
					<a
						href={`mailto:${content.contactEmail}`}
						className="text-sm text-muted-foreground underline decoration-[color:rgba(166,124,82,0.45)] underline-offset-4"
					>
						{content.contactEmail}
					</a>
					<Link
						to="/"
						className="inline-flex items-center justify-center rounded-full border border-input px-4 py-2 text-sm text-foreground transition-colors duration-200 hover:bg-[color:rgba(243,236,227,0.65)]"
					>
						{content.backToHomeLabel}
					</Link>
				</footer>
			</div>
		</div>
	);
}
