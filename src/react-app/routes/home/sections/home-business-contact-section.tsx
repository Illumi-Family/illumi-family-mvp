import type { HomeBusinessContactContent } from "@/routes/home-page.data";
import { SectionHeading } from "@/routes/home/components/section-heading";

type HomeBusinessContactSectionProps = {
	content: HomeBusinessContactContent;
};

export function HomeBusinessContactSection({ content }: HomeBusinessContactSectionProps) {
	return (
		<section id={content.sectionId} className="space-y-6 py-1 md:space-y-8 md:py-2">
			<SectionHeading
				label={content.label}
				title={content.title}
				description={content.description}
			/>
			<div className="grid gap-3 md:grid-cols-3 md:gap-4">
				<article className="space-y-1.5 rounded-xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.82)] px-4 py-4 md:space-y-2 md:rounded-2xl md:px-5 md:py-5">
					<p className="text-[11px] uppercase tracking-[0.08em] text-[color:var(--brand-primary)] md:text-xs md:tracking-[0.12em]">
						手机 
					</p>
					<p className="text-lg font-semibold leading-tight text-foreground md:text-xl">
						{content.phone}
					</p>
				</article>
				<article className="space-y-1.5 rounded-xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.82)] px-4 py-4 md:space-y-2 md:rounded-2xl md:px-5 md:py-5">
					<p className="text-[11px] uppercase tracking-[0.08em] text-[color:var(--brand-primary)] md:text-xs md:tracking-[0.12em]">
						微信
					</p>
					<p className="text-lg font-semibold leading-tight text-foreground md:text-xl">
						{content.wechat}
					</p>
				</article>
				<article className="space-y-1.5 rounded-xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.82)] px-4 py-4 md:space-y-2 md:rounded-2xl md:px-5 md:py-5">
					<p className="text-[11px] uppercase tracking-[0.08em] text-[color:var(--brand-primary)] md:text-xs md:tracking-[0.12em]">
						邮箱
					</p>
					<a
						href={`mailto:${content.email}`}
						className="break-all text-base font-semibold leading-tight text-foreground underline decoration-[color:rgba(166,124,82,0.45)] underline-offset-2 md:text-xl md:underline-offset-4"
					>
						{content.email}
					</a>
				</article>
			</div>
		</section>
	);
}
