interface HeroSectionProps {
	title: string;
	subtitle: string;
	descriptionLines: string[];
}

const normalizeDescriptionLines = (lines: string[]) =>
	lines.map((line) => line.trim()).filter((line) => line.length > 0);

export function HeroSection({ title, subtitle, descriptionLines }: HeroSectionProps) {
	const normalizedLines = normalizeDescriptionLines(descriptionLines);
	const detailLines = normalizedLines.slice(0, 3);
	const hasDetailLines = detailLines.length > 0;

	return (
		<section
			id="hero"
			aria-label={`${title} ${subtitle}`}
			className="relative overflow-hidden rounded-[1.45rem] border border-[color:rgba(166,124,82,0.2)] bg-[linear-gradient(180deg,rgba(255,252,247,0.74),rgba(255,252,247,0.88))]"
		>

			<div
				className={`relative z-10 grid gap-3 px-4 py-3 sm:px-5 md:gap-7 md:px-8 md:py-5 lg:px-9 ${
					hasDetailLines
						? "md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-start"
						: "md:grid-cols-1"
				}`}
			>
				<div className="max-w-3xl space-y-2 motion-enter md:space-y-2.5" style={{ animationDelay: "60ms" }}>
					<h1 className="font-brand text-[clamp(1.7rem,3.8vw,3.2rem)] leading-[1.08] tracking-[-0.018em] text-foreground">
						{title}
					</h1>
					<p className="font-brand text-[clamp(1.26rem,1.95vw,1.95rem)] leading-[1.2] text-[color:var(--brand-primary)]">
						{subtitle}
					</p>
				</div>

				{hasDetailLines ? (
					<aside
						className="motion-enter md:w-full md:max-w-[31rem] md:justify-self-end text-right"
						style={{ animationDelay: "120ms" }}
					>
						<ol className="space-y-2.5">
							{detailLines.map((line, index) => (
								<li
									key={`${line}-${index}`}
									className="text-sm leading-[1.58] text-[color:rgba(66,58,49,0.86)] md:text-[15px]"
								>
									{line}
								</li>
							))}
						</ol>
					</aside>
				) : null}
			</div>
		</section>
	);
}
