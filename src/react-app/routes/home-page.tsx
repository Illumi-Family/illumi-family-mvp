import { useQuery } from "@tanstack/react-query";
import {
	aboutContent,
	defaultHomeContent,
	footerContent,
	heroContent,
	siteMeta,
	siteNavigation,
} from "@/routes/home-page.data";
import { homeContentQueryOptions } from "@/lib/query-options";
import { AboutSection } from "@/routes/home/sections/about-section";
import { ColearningSection } from "@/routes/home/sections/colearning-section";
import { DailyNotesSection } from "@/routes/home/sections/daily-notes-section";
import { FooterSection } from "@/routes/home/sections/footer-section";
import { HeroSection } from "@/routes/home/sections/hero-section";
import { PhilosophySection } from "@/routes/home/sections/philosophy-section";
import { StoriesSection } from "@/routes/home/sections/stories-section";

export function HomePage() {
	const homeContentQuery = useQuery(homeContentQueryOptions());
	const homeContent = homeContentQuery.data ?? defaultHomeContent;
	const showFallbackHint = homeContentQuery.isError;

	return (
		<div className="relative isolate min-h-screen overflow-x-clip">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(212,184,133,0.16),transparent_45%),radial-gradient(circle_at_90%_8%,rgba(166,124,82,0.12),transparent_38%)]"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(180deg,rgba(255,252,247,0.9),transparent)]"
			/>

			<header className="sticky top-3 z-40 px-3 md:px-6">
				<div className="mx-auto mt-2 flex w-full max-w-7xl items-center justify-between gap-3 rounded-2xl border border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.85)] px-4 py-3 backdrop-blur-md">
					<a href="/" className="flex min-w-0 items-center gap-3">
						<img
							src="/images/illumi-family-logo.png"
							alt="童蒙家塾 logo"
							className="h-9 w-auto rounded-md border border-[color:rgba(166,124,82,0.2)] bg-card p-1"
						/>
						<div className="min-w-0">
							{/* <p className="truncate font-brand text-lg text-foreground">{siteMeta.brandName}</p> */}
							<p className="truncate text-xs text-muted-foreground">{siteMeta.brandSubtitle}</p>
						</div>
					</a>

					<nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
						{siteNavigation.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-[color:rgba(166,124,82,0.12)] hover:text-foreground"
							>
								{item.label}
							</a>
						))}
					</nav>

					<a
						href={siteMeta.headerCta.href}
						className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-[color:rgba(166,124,82,0.92)]"
					>
						{siteMeta.headerCta.label}
					</a>
				</div>

				<nav
					className="mx-auto mt-2 flex w-full max-w-7xl gap-2 overflow-x-auto rounded-xl border border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.88)] px-3 py-2 lg:hidden"
					aria-label="移动端快捷导航"
				>
					{siteNavigation.map((item) => (
						<a
							key={`mobile-${item.href}`}
							href={item.href}
							className="whitespace-nowrap rounded-full bg-[color:rgba(243,236,227,0.9)] px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:bg-[color:rgba(212,184,133,0.3)] hover:text-foreground"
						>
							{item.label}
						</a>
					))}
				</nav>
			</header>

			<main id="main-content" className="mx-auto w-full max-w-7xl space-y-20 px-4 pb-20 pt-4 md:px-8 md:pt-6">
				{showFallbackHint ? (
					<div className="rounded-2xl border border-[color:rgba(166,124,82,0.22)] bg-[color:rgba(255,252,247,0.82)] px-4 py-3 text-sm text-muted-foreground">
						内容服务暂时不可用，当前展示本地兜底内容。
					</div>
				) : null}
				<HeroSection content={heroContent} />
				<PhilosophySection
					intro={homeContent.philosophy.intro}
					items={homeContent.philosophy.items}
				/>
				<DailyNotesSection items={homeContent.dailyNotes.items} />
				<StoriesSection items={homeContent.stories.items} />
				<ColearningSection
					intro={homeContent.colearning.intro}
					methods={homeContent.colearning.methods}
					benefits={homeContent.colearning.benefits}
					caseHighlight={homeContent.colearning.caseHighlight}
				/>
				<AboutSection content={aboutContent} />
			</main>

			<FooterSection content={footerContent} />
		</div>
	);
}
