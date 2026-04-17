import type { HeroContent } from "@/routes/home-page.data";

interface HeroSectionProps {
	content: HeroContent;
}

export function HeroSection({ content }: HeroSectionProps) {
	return (
		<section
			id="hero"
			aria-label={`${content.title} ${content.subtitle}`}
			className="relative overflow-hidden rounded-[2rem] border border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.78)]"
		>
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[radial-gradient(circle_at_6%_12%,rgba(212,184,133,0.2),transparent_42%),radial-gradient(circle_at_94%_4%,rgba(166,124,82,0.14),transparent_34%)]"
			/>
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,252,247,0.58)_0%,rgba(255,252,247,0.82)_100%)]"
			/>

			<div className="relative z-10 px-6 py-10 md:px-10 md:py-12 lg:px-12 lg:py-14">
				<div className="max-w-4xl space-y-6 motion-enter" style={{ animationDelay: "60ms" }}>
					<div className="space-y-3">
						<h1 className="font-brand text-4xl leading-tight text-foreground md:text-6xl">
							{content.title}
						</h1>
						<p className="font-brand text-2xl leading-relaxed text-[color:var(--brand-primary)] md:text-3xl">
							{content.subtitle}
						</p>
					</div>
					<div className="space-y-1 text-base leading-relaxed text-muted-foreground md:text-lg">
						{content.descriptionLines.map((line) => (
							<p key={line}>{line}</p>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
