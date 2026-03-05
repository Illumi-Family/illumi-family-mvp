import type { FooterLink } from "@/routes/home-page.data";

interface FooterSectionProps {
	content: {
		sloganLine1: string;
		sloganLine2: string;
		copyright: string;
		contactEmail: string;
		links: FooterLink[];
	};
}

export function FooterSection({ content }: FooterSectionProps) {
	return (
		<footer className="border-t border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.82)] px-4 py-10 md:px-8">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<div className="space-y-2">
					<p className="font-brand text-2xl text-foreground">{content.sloganLine1}</p>
					<p className="font-brand text-2xl text-foreground">{content.sloganLine2}</p>
				</div>
				<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
					{content.links.map((link) => (
						<a
							key={link.label}
							href={link.href}
							className="rounded-full border border-input px-3 py-1.5 transition-colors duration-200 hover:bg-[color:rgba(243,236,227,0.65)]"
						>
							{link.label}
						</a>
					))}
				</div>
				<div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
					<p>{content.copyright}</p>
					<a
						href={`mailto:${content.contactEmail}`}
						className="underline decoration-[color:rgba(166,124,82,0.45)] underline-offset-4"
					>
						{content.contactEmail}
					</a>
				</div>
			</div>
		</footer>
	);
}
